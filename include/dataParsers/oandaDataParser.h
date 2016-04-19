#ifndef OANDADATAPARSER_H
#define OANDADATAPARSER_H

#include <fstream>
#include <iterator>
#include <vector>
#include <sstream>
#include <iostream>
#include <stdlib.h>
#include "dataParsers/dataParser.h"
#include "types/tick.h"

class OandaDataParser : public DataParser {
    private:
        std::string filePath;

    public:
        OandaDataParser(std::string filePath);
        std::vector<Tick*> *parse();
};

#endif