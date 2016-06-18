#include "optimizers/optimizer.cuh"

// CUDA kernel for backtesting strategies.
__global__ void optimizer_backtest(double *data, int dataPropertyCount, ReversalsOptimizationStrategy *strategies, int strategyCount, double investment, double profitability) {
    extern __shared__ double sharedData[];

    if (threadIdx.x < dataPropertyCount) {
        sharedData[threadIdx.x] = data[threadIdx.x];
    }

    __syncthreads();

    // Use a grid-stride loop.
    // Reference: https://devblogs.nvidia.com/parallelforall/cuda-pro-tip-write-flexible-kernels-grid-stride-loops/
    for (int i = blockIdx.x * blockDim.x + threadIdx.x;
         i < strategyCount;
         i += blockDim.x * gridDim.x)
    {
        strategies[i].backtest(sharedData, investment, profitability);
    }
}

Optimizer::Optimizer(mongoc_client_t *dbClient, std::string strategyName, std::string symbol, int type, int group) {
    this->dbClient = dbClient;
    this->strategyName = strategyName;
    this->symbol = symbol;
    this->type = type;
    this->group = group;
    this->dataPropertyCount = 0;
    this->dataIndexMap = new std::map<std::string, int>();

    if (type == Optimizer::types::TEST) {
        this->groupFilter = "testingGroups";
    }
    else if (type == Optimizer::types::VALIDATION) {
        this->groupFilter = "validationGroups";
    }
    else if (type != Optimizer::types::FORWARDTEST) {
        throw std::runtime_error("Invalid optimization type");
    }
}

mongoc_client_t *Optimizer::getDbClient() {
    return this->dbClient;
}

std::string Optimizer::getStrategyName() {
    return this->strategyName;
}

std::string Optimizer::getSymbol() {
    return this->symbol;
}

int Optimizer::getGroup() {
    return this->group;
}

bson_t *Optimizer::convertTickToBson(Tick *tick) {
    bson_t *document;
    bson_t dataDocument;

    document = bson_new();
    BSON_APPEND_UTF8(document, "symbol", this->symbol.c_str());
    BSON_APPEND_INT32(document, "type", tick->at("type"));

    if (getType() == Optimizer::types::TEST || getType() == Optimizer::types::VALIDATION) {
        BSON_APPEND_INT32(document, "testingGroups", tick->at("testingGroups"));
        BSON_APPEND_INT32(document, "validationGroups", tick->at("validationGroups"));

        // Remove group keys as they are no longer needed.
        tick->erase("testingGroups");
        tick->erase("validationGroups");
    }

    // Remove type key as it is no longer needed.
    tick->erase("type");

    BSON_APPEND_DOCUMENT_BEGIN(document, "data", &dataDocument);

    // Add tick properties to document.
    for (Tick::iterator propertyIterator = tick->begin(); propertyIterator != tick->end(); ++propertyIterator) {
        bson_append_double(&dataDocument, propertyIterator->first.c_str(), propertyIterator->first.length(), propertyIterator->second);
    }

    bson_append_document_end(document, &dataDocument);

    return document;
}

void Optimizer::saveTicks(std::vector<Tick*> ticks) {
    if (ticks.size() == 0) {
        return;
    }

    mongoc_collection_t *collection;
    mongoc_bulk_operation_t *bulkOperation;
    bson_t bulkOperationReply;
    bson_error_t bulkOperationError;

    // Get a reference to the database collection.
    collection = mongoc_client_get_collection(this->dbClient, "forex-backtesting", "datapoints");

    // Begin a bulk operation.
    bulkOperation = mongoc_collection_create_bulk_operation(collection, false, NULL);

    // Reference: http://api.mongodb.org/c/current/bulk.html
    for (std::vector<Tick*>::iterator insertionIterator = ticks.begin(); insertionIterator != ticks.end(); ++insertionIterator) {
        bson_t *document = convertTickToBson(*insertionIterator);
        mongoc_bulk_operation_insert(bulkOperation, document);
        bson_destroy(document);
    }

    // Execute the bulk operation.
    mongoc_bulk_operation_execute(bulkOperation, &bulkOperationReply, &bulkOperationError);

    // Cleanup.
    mongoc_collection_destroy(collection);
    mongoc_bulk_operation_destroy(bulkOperation);
    bson_destroy(&bulkOperationReply);
}

void Optimizer::prepareData(std::vector<Tick*> ticks) {
    double percentage;
    int tickCount = ticks.size();
    std::vector<Tick*> cumulativeTicks;
    int cumulativeTickCount;
    int threadCount = std::thread::hardware_concurrency();
    maginatics::ThreadPool pool(1, threadCount, 5000);
    std::vector<Study*> studies = this->getStudies();
    int i = 0;
    int j = 0;

    // Reserve space in advance for better performance.
    cumulativeTicks.reserve(tickCount);

    printf("Preparing data...");

    // Go through the data and run studies for each data item.
    for (std::vector<Tick*>::iterator tickIterator = ticks.begin(); tickIterator != ticks.end(); ++tickIterator) {
        // Show progress.
        percentage = (++i / (double)tickCount) * 100.0;
        printf("\rPreparing data...%0.4f%%", percentage);

        Tick *tick = *tickIterator;
        Tick *previousTick = nullptr;

        if (cumulativeTicks.size() > 0) {
            previousTick = cumulativeTicks.back();
        }

        // If the previous tick's minute was not the previous minute, then save the current
        // ticks, and start over with recording.
        if (previousTick && ((*tick)["timestamp"] - (*previousTick)["timestamp"]) > 60) {
            previousTick = nullptr;

            // Save and then remove the current cumulative ticks.
            saveTicks(cumulativeTicks);

            // Release memory.
            cumulativeTickCount = cumulativeTicks.size();
            for (j=0; j<cumulativeTickCount; j++) {
                delete cumulativeTicks[j];
                cumulativeTicks[j] = nullptr;
            }
            std::vector<Tick*>().swap(cumulativeTicks);
        }

        previousTick = tick;

        // Append to the cumulative data.
        cumulativeTicks.push_back(tick);

        for (std::vector<Study*>::iterator studyIterator = studies.begin(); studyIterator != studies.end(); ++studyIterator) {
            // Update the data for the study.
            (*studyIterator)->setData(&cumulativeTicks);

            // Use a thread pool so that all CPU cores can be used.
            pool.execute([studyIterator]() {
                // Process the latest data for the study.
                (*studyIterator)->tick();
            });
        }

        // Block until all tasks for the current data point complete.
        pool.drain();

        // Merge tick output values from the studies into the current tick.
        for (std::vector<Study*>::iterator studyIterator = studies.begin(); studyIterator != studies.end(); ++studyIterator) {
            std::map<std::string, double> studyOutputs = (*studyIterator)->getTickOutputs();

            for (std::map<std::string, double>::iterator outputIterator = studyOutputs.begin(); outputIterator != studyOutputs.end(); ++outputIterator) {
                (*tick)[outputIterator->first] = outputIterator->second;
            }
        }

        // Periodically save tick data to the database and free up memory.
        if (cumulativeTicks.size() >= 2000) {
            // Extract the first ~1000 ticks to be inserted.
            std::vector<Tick*> firstCumulativeTicks(cumulativeTicks.begin(), cumulativeTicks.begin() + (cumulativeTicks.size() - 1000));

            // Write ticks to database.
            saveTicks(firstCumulativeTicks);

            // Release memory.
            for (j=0; j<1000; j++) {
                delete cumulativeTicks[j];
                cumulativeTicks[j] = nullptr;
            }
            std::vector<Tick*>().swap(firstCumulativeTicks);

            // Keep only the last 1000 elements.
            std::vector<Tick*>(cumulativeTicks.begin() + (cumulativeTicks.size() - 1000), cumulativeTicks.end()).swap(cumulativeTicks);
        }

        tick = nullptr;
        previousTick = nullptr;
    }

    printf("\n");
}

int Optimizer::getType() {
    return this->type;
}

int Optimizer::getTypeId(std::string name) {
    if (name == "test") {
        return Optimizer::types::TEST;
    }
    else if (name == "validation") {
        return Optimizer::types::VALIDATION;
    }
    else if (name == "forwardTest") {
        return Optimizer::types::FORWARDTEST;
    }
    else {
        throw std::runtime_error("Invalid optimization type");
    }
}

int Optimizer::getDataPropertyCount() {
    if (this->dataPropertyCount) {
        return this->dataPropertyCount;
    }

    std::vector<Study*> studies = this->getStudies();
    this->dataPropertyCount = 7;

    for (std::vector<Study*>::iterator iterator = studies.begin(); iterator != studies.end(); ++iterator) {
        this->dataPropertyCount += (*iterator)->getOutputMap().size();
    }

    return this->dataPropertyCount;
}

std::map<std::string, int> *Optimizer::getDataIndexMap() {
    if (this->dataIndexMap->size() > 0) {
        return this->dataIndexMap;
    }

    std::vector<std::string> properties;

    // Add basic properties.
    properties.push_back("timestamp");
    properties.push_back("timestampHour");
    properties.push_back("timestampMinute");
    properties.push_back("open");
    properties.push_back("high");
    properties.push_back("low");
    properties.push_back("close");

    std::vector<Study*> studies = this->getStudies();

    for (std::vector<Study*>::iterator iterator = studies.begin(); iterator != studies.end(); ++iterator) {
        std::map<std::string, std::string> outputMap = (*iterator)->getOutputMap();

        for (std::map<std::string, std::string>::iterator outputMapIterator = outputMap.begin(); outputMapIterator != outputMap.end(); ++outputMapIterator) {
            properties.push_back(outputMapIterator->second);
        }
    }

    std::sort(properties.begin(), properties.end());

    for (std::vector<std::string>::iterator propertyIterator = properties.begin(); propertyIterator != properties.end(); ++propertyIterator) {
        (*this->dataIndexMap)[*propertyIterator] = std::distance(properties.begin(), propertyIterator);
    }

    return this->dataIndexMap;
}

double *Optimizer::loadData(int lastTimestamp, int chunkSize) {
    mongoc_collection_t *collection;
    mongoc_cursor_t *cursor;
    bson_t *query;
    const bson_t *document;
    bson_iter_t documentIterator;
    bson_iter_t dataIterator;
    const char *propertyName;
    const bson_value_t *propertyValue;
    int dataPropertyCount = getDataPropertyCount();
    int dataPointIndex = 0;
    std::map<std::string, int> *tempDataIndexMap = this->getDataIndexMap();

    // Get a reference to the database collection.
    collection = mongoc_client_get_collection(this->dbClient, "forex-backtesting", "datapoints");

    // Allocate memory for the flattened data store.
    uint64_t dataChunkBytes = chunkSize * dataPropertyCount * sizeof(double);
    double *data = (double*)malloc(dataChunkBytes);

    // Query the database.
    if (getType() == Optimizer::types::TEST || getType() == Optimizer::types::VALIDATION) {
        query = BCON_NEW(
            "$query", "{",
                "data.timestamp", "{", "$gt", BCON_DOUBLE((double)lastTimestamp), "}",
                "symbol", BCON_UTF8(this->symbol.c_str()),
                "type", BCON_INT32(DataParser::types::BACKTEST),
                this->groupFilter.c_str(), "{", "$bitsAnySet", BCON_INT32((int)pow(2, this->group)), "}",
            "}",
            "$orderby", "{", "data.timestamp", BCON_INT32(1), "}",
            "$hint", "{", "data.timestamp", BCON_INT32(1), "}"
        );
    }
    else if (getType() == Optimizer::types::FORWARDTEST) {
        query = BCON_NEW(
            "$query", "{",
                "data.timestamp", "{", "$gt", BCON_DOUBLE((double)lastTimestamp), "}",
                "symbol", BCON_UTF8(this->symbol.c_str()),
                "type", BCON_INT32(DataParser::types::FORWARDTEST),
            "}",
            "$orderby", "{", "data.timestamp", BCON_INT32(1), "}",
            "$hint", "{", "data.timestamp", BCON_INT32(1), "}"
        );
    }
    else {
        throw std::runtime_error("Invalid optimization type");
    }
    cursor = mongoc_collection_find(collection, MONGOC_QUERY_NONE, 0, chunkSize, 1000, query, NULL, NULL);

    // Go through query results, and convert each document into an array.
    while (mongoc_cursor_next(cursor, &document)) {
        if (bson_iter_init(&documentIterator, document)) {
            // Find the "data" subdocument.
            if (bson_iter_init_find(&documentIterator, document, "data") &&
                BSON_ITER_HOLDS_DOCUMENT(&documentIterator) &&
                bson_iter_recurse(&documentIterator, &dataIterator))
            {
                // Iterate through the data properties.
                while (bson_iter_next(&dataIterator)) {
                    // Get the property name and value.
                    propertyName = bson_iter_key(&dataIterator);
                    propertyValue = bson_iter_value(&dataIterator);

                    // Ignore the property if it is not in the data index map.
                    if (tempDataIndexMap->find(propertyName) == tempDataIndexMap->end()) {
                        continue;
                    }

                    // Add the data property value to the flattened data store.
                    data[dataPointIndex * dataPropertyCount + (*tempDataIndexMap)[propertyName]] = propertyValue->value.v_double;
                }

                // Add additional timestamp-related data.
                time_t utcTime = data[dataPointIndex * dataPropertyCount + (*tempDataIndexMap)["timestamp"]];
                struct tm *localTime = localtime(&utcTime);
                data[dataPointIndex * dataPropertyCount + (*tempDataIndexMap)["timestampHour"]] = (double)localTime->tm_hour;
                data[dataPointIndex * dataPropertyCount + (*tempDataIndexMap)["timestampMinute"]] = (double)localTime->tm_min;
            }
        }

        dataPointIndex++;
    }

    // Cleanup.
    bson_destroy(query);
    mongoc_cursor_destroy(cursor);
    mongoc_collection_destroy(collection);

    // Return the pointer to the data.
    return data;
}

std::vector<MapConfiguration> *Optimizer::buildMapConfigurations(
    std::map<std::string, ConfigurationOption> options,
    int optionIndex,
    std::vector<MapConfiguration> *results,
    MapConfiguration *current
) {
    std::vector<std::string> allKeys;
    std::string optionKey;
    ConfigurationOption configurationOptions;

    // Get all options keys.
    for (std::map<std::string, ConfigurationOption>::iterator optionsIterator = options.begin(); optionsIterator != options.end(); ++optionsIterator) {
        allKeys.push_back(optionsIterator->first);
    }

    optionKey = allKeys[optionIndex];
    configurationOptions = options[optionKey];

    for (ConfigurationOption::iterator configurationOptionsIterator = configurationOptions.begin(); configurationOptionsIterator != configurationOptions.end(); ++configurationOptionsIterator) {
        // Iterate through configuration option values.
        for (std::map<std::string, boost::variant<std::string, double, int>>::iterator valuesIterator = configurationOptionsIterator->begin(); valuesIterator != configurationOptionsIterator->end(); ++valuesIterator) {
            if (valuesIterator->second.type() == typeid(std::string)) {
                if (boost::get<std::string>(valuesIterator->second).length() > 0) {
                    // Value points to a key.
                    (*current)[valuesIterator->first] = (*this->dataIndexMap)[boost::get<std::string>(valuesIterator->second)];
                }
            }
            else if (valuesIterator->second.type() == typeid(double)) {
                // Value is an actual value.
                (*current)[valuesIterator->first] = boost::get<double>(valuesIterator->second);
            }
            else if (valuesIterator->second.type() == typeid(int)) {
                // Value is an int. In this case, it will always be 0 (like false but not actually
                // bool for technical reasons) designating it's not used. So, set the value to 0
                // designating no index map value.
                (*current)[valuesIterator->first] = boost::get<int>(valuesIterator->second);
            }
        }

        if (optionIndex + 1 < allKeys.size()) {
            buildMapConfigurations(options, optionIndex + 1, results, current);
        }
        else {
            // Dereference the pointer so that every configuration is not the same.
            results->push_back(*current);
        }
    }

    return results;
}

void Optimizer::optimize(double investment, double profitability) {
    std::vector<Configuration*> configurations;
    double percentage;
    mongoc_collection_t *collection;
    bson_t *countQuery;
    bson_error_t countQueryError;
    std::map<std::string, int> *tempDataIndexMap = getDataIndexMap();
    int dataPropertyCount = getDataPropertyCount();
    int dataPointCount;
    int configurationCount;
    int dataChunkSize = 500000;
    int dataOffset = 0;
    int chunkNumber = 1;
    int dataPointIndex = 0;
    int lastTimestamp = 0;
    std::vector<StrategyResult> results;
    int i = 0;
    int j = 0;

    // Build or load configurations.
    if (getType() == Optimizer::types::TEST || getType() == Optimizer::types::VALIDATION) {
        if (getGroup() == 1) {
            configurations = buildBaseConfigurations();
        }
        else {
            configurations = buildGroupConfigurations();
        }
    }
    else if (getType() == Optimizer::types::FORWARDTEST) {
        configurations = buildSavedConfigurations();
    }
    else {
        throw std::runtime_error("Invalid optimization type");
    }

    configurationCount = configurations.size();

    // GPU settings.
    // Reference: https://devblogs.nvidia.com/parallelforall/cuda-pro-tip-write-flexible-kernels-grid-stride-loops/
    int gpuBlockCount = 32;
    int gpuThreadsPerBlock = 1024;
    int gpuCount;
    int gpuMultiprocessorCount;

    // Get GPU specs.
    cudaGetDeviceCount(&gpuCount);
    cudaDeviceGetAttribute(&gpuMultiprocessorCount, cudaDevAttrMultiProcessorCount, 0);

    // Host data.
    ReversalsOptimizationStrategy *strategies[gpuCount];
    int configurationCounts[gpuCount];

    // GPU data.
    ReversalsOptimizationStrategy *devStrategies[gpuCount];

    printf("Optimizing...");

    // Get a count of all data points for the symbol.
    collection = mongoc_client_get_collection(this->dbClient, "forex-backtesting", "datapoints");
    if (getType() == Optimizer::types::TEST || getType() == Optimizer::types::VALIDATION) {
        countQuery = BCON_NEW(
            "symbol", BCON_UTF8(this->symbol.c_str()),
            "type", BCON_INT32(DataParser::types::BACKTEST),
            this->groupFilter.c_str(), "{", "$bitsAnySet", BCON_INT32((int)pow(2, this->group)), "}"
        );
    }
    else if (getType() == Optimizer::types::FORWARDTEST) {
        countQuery = BCON_NEW(
            "symbol", BCON_UTF8(this->symbol.c_str()),
            "type", BCON_INT32(DataParser::types::FORWARDTEST)
        );
    }
    else {
        throw std::runtime_error("Invalid optimization type");
    }

    dataPointCount = mongoc_collection_count(collection, MONGOC_QUERY_NONE, countQuery, 0, 0, NULL, &countQueryError);

    for (i=0; i<gpuCount; i++) {
        // Allocate data for strategies.
        strategies[i] = (ReversalsOptimizationStrategy*)malloc(configurationCount * sizeof(ReversalsOptimizationStrategy));
        configurationCounts[i] = 0;
    }

    // Set up one strategy instance per configuration, and keep track of strategy counts.
    for (i=0; i<configurationCount; i++) {
        int gpuDeviceId = i % gpuCount;
        int gpuConfigurationIndex = configurationCounts[gpuDeviceId];

        strategies[gpuDeviceId][gpuConfigurationIndex] = ReversalsOptimizationStrategy(this->symbol.c_str(), *configurations[i]);
        configurationCounts[gpuDeviceId]++;
    }

    for (i=0; i<gpuCount; i++) {
        cudaSetDevice(i);

        // Allocate memory on the GPU for strategies.
        cudaMalloc((void**)&devStrategies[i], configurationCounts[i] * sizeof(ReversalsOptimizationStrategy));

        // Copy strategies to the GPU.
        cudaMemcpy(devStrategies[i], strategies[i], configurationCounts[i] * sizeof(ReversalsOptimizationStrategy), cudaMemcpyHostToDevice);
    }

    while (dataOffset < dataPointCount) {
        int nextChunkSize;

        // Calculate the next chunk's size.
        if (chunkNumber * dataChunkSize < dataPointCount) {
            nextChunkSize = dataChunkSize;
        }
        else {
            nextChunkSize = dataChunkSize - ((chunkNumber * dataChunkSize) - dataPointCount);
        }

        // Calculate the number of bytes needed for the next chunk.
        uint64_t dataChunkBytes = nextChunkSize * dataPropertyCount * sizeof(double);

        // Load another chunk of data.
        double *data = loadData(lastTimestamp, nextChunkSize);
        double *devData[gpuCount];

        for (i=0; i<gpuCount; i++) {
            cudaSetDevice(i);

            // Allocate memory for the data on the GPU.
            cudaMalloc((void**)&devData[i], dataChunkBytes);

            // Copy a chunk of data points to the GPU.
            cudaMemcpy(devData[i], data, dataChunkBytes, cudaMemcpyHostToDevice);
        }

        // Backtest all strategies against all data points in the chunk.
        for (i=0; i<nextChunkSize; i++) {
            // Calculate the data pointer offset.
            unsigned int dataPointerOffset = i * dataPropertyCount;

            // Show progress.
            percentage = ((dataPointIndex + 1) / (double)dataPointCount) * 100.0;
            printf("\rOptimizing...%0.4f%%", percentage);

            for (j=0; j<gpuCount; j++) {
                cudaSetDevice(j);
                optimizer_backtest<<<gpuBlockCount * gpuMultiprocessorCount, gpuThreadsPerBlock, dataPropertyCount * sizeof(double)>>>(
                    devData[j] + dataPointerOffset,
                    dataPropertyCount,
                    devStrategies[j],
                    configurationCounts[j],
                    investment,
                    profitability
                );
            }

            dataPointIndex++;
        }

        // Update the last timestamp (used for fast querying).
        lastTimestamp = (int)data[(nextChunkSize - 1) * dataPropertyCount + (*tempDataIndexMap)["timestamp"]];

        // Free GPU and host memory. Make SURE to set data to nullptr, or some shit will ensue.
        for (i=0; i<gpuCount; i++) {
            cudaFree(devData[i]);
        }
        free(data);
        data = nullptr;

        chunkNumber++;
        dataOffset += nextChunkSize;
    }

    // Copy strategies from the GPU to the host.
    for (i=0; i<gpuCount; i++) {
        cudaSetDevice(i);
        cudaMemcpy(strategies[i], devStrategies[i], configurationCounts[i] * sizeof(ReversalsOptimizationStrategy), cudaMemcpyDeviceToHost);
    }

    printf("\rOptimizing...100%%          \n");

    // Save the results to the database.
    for (i=0; i<gpuCount; i++) {
        for (j=0; j<configurationCounts[i]; j++) {
            StrategyResult result = strategies[i][j].getResult();
            result.configuration = &strategies[i][j].getConfiguration();

            results.push_back(result);
        }
    }
    saveResults(results);

    // Free memory on the GPUs.
    for (i=0; i<gpuCount; i++) {
        cudaSetDevice(i);
        cudaFree(devStrategies[i]);
    }

    // Free host memory and cleanup.
    for (i=0; i<gpuCount; i++) {
        free(strategies[i]);
        strategies[i] = nullptr;
    }
    bson_destroy(countQuery);
    mongoc_collection_destroy(collection);
}

std::string Optimizer::findDataIndexMapKeyByValue(int value) {
    std::map<std::string, int> *tempDataIndexMap = getDataIndexMap();
    std::string key = "";

    for (std::map<std::string, int>::iterator iterator = tempDataIndexMap->begin(); iterator != tempDataIndexMap->end(); ++iterator) {
        if (iterator->second == value) {
            key = iterator->first;
            break;
        }
    }

    return key;
};

void Optimizer::saveResults(std::vector<StrategyResult> &results) {
    if (results.size() == 0) {
        return;
    }

    printf("Saving results...");

    mongoc_collection_t *collection;
    mongoc_bulk_operation_t *bulkOperation;
    bson_t bulkOperationReply;
    bson_error_t bulkOperationError;

    std::string collectionName;

    if (getType() == Optimizer::types::TEST) {
        collectionName = "tests";
    }
    else if (getType() == Optimizer::types::VALIDATION) {
        collectionName = "validations";
    }
    else if (getType() == Optimizer::types::FORWARDTEST) {
        collectionName = "forwardtests";
    }
    else {
        throw std::runtime_error("Invalid optimization type");
    }

    // Get a reference to the database collection.
    collection = mongoc_client_get_collection(this->dbClient, "forex-backtesting", collectionName.c_str());

    // Begin a bulk operation.
    bulkOperation = mongoc_collection_create_bulk_operation(collection, false, NULL);

    // Reference: http://api.mongodb.org/c/current/bulk.html
    for (std::vector<StrategyResult>::iterator insertionIterator = results.begin(); insertionIterator != results.end(); ++insertionIterator) {
        bson_t *document = convertResultToBson(*insertionIterator);
        mongoc_bulk_operation_insert(bulkOperation, document);
        bson_destroy(document);
    }

    // Execute the bulk operation.
    mongoc_bulk_operation_execute(bulkOperation, &bulkOperationReply, &bulkOperationError);

    // Cleanup.
    mongoc_collection_destroy(collection);
    mongoc_bulk_operation_destroy(bulkOperation);
    bson_destroy(&bulkOperationReply);

    printf("done\n");
}
