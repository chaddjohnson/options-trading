var Base = require('./Base');
var studies = require('../studies');

var studyDefinitions = [
    {study: studies.Ema, inputs: {length: 200}, outputMap: {ema: 'ema200'}},
    {study: studies.Ema, inputs: {length: 100}, outputMap: {ema: 'ema100'}},
    {study: studies.Ema, inputs: {length: 50}, outputMap: {ema: 'ema50'}},
    {study: studies.Sma, inputs: {length: 13}, outputMap: {sma: 'sma13'}},
    {study: studies.Rsi, inputs: {length: 7}, outputMap: {rsi: 'rsi7'}},
    {study: studies.Rsi, inputs: {length: 5}, outputMap: {rsi: 'rsi5'}},
    {study: studies.Rsi, inputs: {length: 2}, outputMap: {rsi: 'rsi2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 2, deviations: 1.9}, outputMap: {regression: 'prChannel100_2_19', upper: 'prChannelUpper100_2_19', lower: 'prChannelLower100_2_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 3, deviations: 1.9}, outputMap: {regression: 'prChannel100_3_19', upper: 'prChannelUpper100_3_19', lower: 'prChannelLower100_3_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 4, deviations: 1.9}, outputMap: {regression: 'prChannel100_4_19', upper: 'prChannelUpper100_4_19', lower: 'prChannelLower100_4_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 2, deviations: 1.95}, outputMap: {regression: 'prChannel100_2_195', upper: 'prChannelUpper100_2_195', lower: 'prChannelLower100_2_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 3, deviations: 1.95}, outputMap: {regression: 'prChannel100_3_195', upper: 'prChannelUpper100_3_195', lower: 'prChannelLower100_3_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 4, deviations: 1.95}, outputMap: {regression: 'prChannel100_4_195', upper: 'prChannelUpper100_4_195', lower: 'prChannelLower100_4_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 2, deviations: 2.0}, outputMap: {regression: 'prChannel100_2_20', upper: 'prChannelUpper100_2_20', lower: 'prChannelLower100_2_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 3, deviations: 2.0}, outputMap: {regression: 'prChannel100_3_20', upper: 'prChannelUpper100_3_20', lower: 'prChannelLower100_3_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 4, deviations: 2.0}, outputMap: {regression: 'prChannel100_4_20', upper: 'prChannelUpper100_4_20', lower: 'prChannelLower100_4_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 2, deviations: 2.1}, outputMap: {regression: 'prChannel100_2_21', upper: 'prChannelUpper100_2_21', lower: 'prChannelLower100_2_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 3, deviations: 2.1}, outputMap: {regression: 'prChannel100_3_21', upper: 'prChannelUpper100_3_21', lower: 'prChannelLower100_3_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 4, deviations: 2.1}, outputMap: {regression: 'prChannel100_4_21', upper: 'prChannelUpper100_4_21', lower: 'prChannelLower100_4_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 2, deviations: 2.15}, outputMap: {regression: 'prChannel100_2_215', upper: 'prChannelUpper100_2_215', lower: 'prChannelLower100_2_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 3, deviations: 2.15}, outputMap: {regression: 'prChannel100_3_215', upper: 'prChannelUpper100_3_215', lower: 'prChannelLower100_3_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 100, degree: 4, deviations: 2.15}, outputMap: {regression: 'prChannel100_4_215', upper: 'prChannelUpper100_4_215', lower: 'prChannelLower100_4_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 2, deviations: 2.15}, outputMap: {regression: 'prChannel200_2_215', upper: 'prChannelUpper200_2_215', lower: 'prChannelLower200_2_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 3, deviations: 2.15}, outputMap: {regression: 'prChannel200_3_215', upper: 'prChannelUpper200_3_215', lower: 'prChannelLower200_3_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 4, deviations: 2.15}, outputMap: {regression: 'prChannel200_4_215', upper: 'prChannelUpper200_4_215', lower: 'prChannelLower200_4_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 2, deviations: 1.9}, outputMap: {regression: 'prChannel200_2_19', upper: 'prChannelUpper200_2_19', lower: 'prChannelLower200_2_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 3, deviations: 1.9}, outputMap: {regression: 'prChannel200_3_19', upper: 'prChannelUpper200_3_19', lower: 'prChannelLower200_3_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 4, deviations: 1.9}, outputMap: {regression: 'prChannel200_4_19', upper: 'prChannelUpper200_4_19', lower: 'prChannelLower200_4_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 2, deviations: 1.95}, outputMap: {regression: 'prChannel200_2_195', upper: 'prChannelUpper200_2_195', lower: 'prChannelLower200_2_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 3, deviations: 1.95}, outputMap: {regression: 'prChannel200_3_195', upper: 'prChannelUpper200_3_195', lower: 'prChannelLower200_3_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 4, deviations: 1.95}, outputMap: {regression: 'prChannel200_4_195', upper: 'prChannelUpper200_4_195', lower: 'prChannelLower200_4_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 2, deviations: 2.0}, outputMap: {regression: 'prChannel200_2_20', upper: 'prChannelUpper200_2_20', lower: 'prChannelLower200_2_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 3, deviations: 2.0}, outputMap: {regression: 'prChannel200_3_20', upper: 'prChannelUpper200_3_20', lower: 'prChannelLower200_3_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 4, deviations: 2.0}, outputMap: {regression: 'prChannel200_4_20', upper: 'prChannelUpper200_4_20', lower: 'prChannelLower200_4_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 2, deviations: 2.1}, outputMap: {regression: 'prChannel200_2_21', upper: 'prChannelUpper200_2_21', lower: 'prChannelLower200_2_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 3, deviations: 2.1}, outputMap: {regression: 'prChannel200_3_21', upper: 'prChannelUpper200_3_21', lower: 'prChannelLower200_3_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 4, deviations: 2.1}, outputMap: {regression: 'prChannel200_4_21', upper: 'prChannelUpper200_4_21', lower: 'prChannelLower200_4_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 2, deviations: 1.9}, outputMap: {regression: 'prChannel250_2_19', upper: 'prChannelUpper250_2_19', lower: 'prChannelLower250_2_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 3, deviations: 1.9}, outputMap: {regression: 'prChannel250_3_19', upper: 'prChannelUpper250_3_19', lower: 'prChannelLower250_3_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 4, deviations: 1.9}, outputMap: {regression: 'prChannel250_4_19', upper: 'prChannelUpper250_4_19', lower: 'prChannelLower250_4_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 2, deviations: 1.95}, outputMap: {regression: 'prChannel250_2_195', upper: 'prChannelUpper250_2_195', lower: 'prChannelLower250_2_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 3, deviations: 1.95}, outputMap: {regression: 'prChannel250_3_195', upper: 'prChannelUpper250_3_195', lower: 'prChannelLower250_3_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 4, deviations: 1.95}, outputMap: {regression: 'prChannel250_4_195', upper: 'prChannelUpper250_4_195', lower: 'prChannelLower250_4_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 2, deviations: 2.0}, outputMap: {regression: 'prChannel250_2_20', upper: 'prChannelUpper250_2_20', lower: 'prChannelLower250_2_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 3, deviations: 2.0}, outputMap: {regression: 'prChannel250_3_20', upper: 'prChannelUpper250_3_20', lower: 'prChannelLower250_3_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 4, deviations: 2.0}, outputMap: {regression: 'prChannel250_4_20', upper: 'prChannelUpper250_4_20', lower: 'prChannelLower250_4_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 2, deviations: 2.1}, outputMap: {regression: 'prChannel250_2_21', upper: 'prChannelUpper250_2_21', lower: 'prChannelLower250_2_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 3, deviations: 2.1}, outputMap: {regression: 'prChannel250_3_21', upper: 'prChannelUpper250_3_21', lower: 'prChannelLower250_3_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 4, deviations: 2.1}, outputMap: {regression: 'prChannel250_4_21', upper: 'prChannelUpper250_4_21', lower: 'prChannelLower250_4_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 2, deviations: 2.15}, outputMap: {regression: 'prChannel250_2_215', upper: 'prChannelUpper250_2_215', lower: 'prChannelLower250_2_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 3, deviations: 2.15}, outputMap: {regression: 'prChannel250_3_215', upper: 'prChannelUpper250_3_215', lower: 'prChannelLower250_3_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 250, degree: 4, deviations: 2.15}, outputMap: {regression: 'prChannel250_4_215', upper: 'prChannelUpper250_4_215', lower: 'prChannelLower250_4_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 2, deviations: 2.15}, outputMap: {regression: 'prChannel300_2_215', upper: 'prChannelUpper300_2_215', lower: 'prChannelLower300_2_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 3, deviations: 2.15}, outputMap: {regression: 'prChannel300_3_215', upper: 'prChannelUpper300_3_215', lower: 'prChannelLower300_3_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 4, deviations: 2.15}, outputMap: {regression: 'prChannel300_4_215', upper: 'prChannelUpper300_4_215', lower: 'prChannelLower300_4_215'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 2, deviations: 1.9}, outputMap: {regression: 'prChannel300_2_19', upper: 'prChannelUpper300_2_19', lower: 'prChannelLower300_2_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 3, deviations: 1.9}, outputMap: {regression: 'prChannel300_3_19', upper: 'prChannelUpper300_3_19', lower: 'prChannelLower300_3_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 4, deviations: 1.9}, outputMap: {regression: 'prChannel300_4_19', upper: 'prChannelUpper300_4_19', lower: 'prChannelLower300_4_19'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 2, deviations: 1.95}, outputMap: {regression: 'prChannel300_2_195', upper: 'prChannelUpper300_2_195', lower: 'prChannelLower300_2_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 3, deviations: 1.95}, outputMap: {regression: 'prChannel300_3_195', upper: 'prChannelUpper300_3_195', lower: 'prChannelLower300_3_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 4, deviations: 1.95}, outputMap: {regression: 'prChannel300_4_195', upper: 'prChannelUpper300_4_195', lower: 'prChannelLower300_4_195'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 2, deviations: 2.0}, outputMap: {regression: 'prChannel300_2_20', upper: 'prChannelUpper300_2_20', lower: 'prChannelLower300_2_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 3, deviations: 2.0}, outputMap: {regression: 'prChannel300_3_20', upper: 'prChannelUpper300_3_20', lower: 'prChannelLower300_3_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 4, deviations: 2.0}, outputMap: {regression: 'prChannel300_4_20', upper: 'prChannelUpper300_4_20', lower: 'prChannelLower300_4_20'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 2, deviations: 2.1}, outputMap: {regression: 'prChannel300_2_21', upper: 'prChannelUpper300_2_21', lower: 'prChannelLower300_2_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 3, deviations: 2.1}, outputMap: {regression: 'prChannel300_3_21', upper: 'prChannelUpper300_3_21', lower: 'prChannelLower300_3_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 4, deviations: 2.1}, outputMap: {regression: 'prChannel300_4_21', upper: 'prChannelUpper300_4_21', lower: 'prChannelLower300_4_21'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 200, degree: 2}, outputMap: {regression: 'trendPrChannel200_2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 300, degree: 2}, outputMap: {regression: 'trendPrChannel300_2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 400, degree: 2}, outputMap: {regression: 'trendPrChannel400_2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 450, degree: 2}, outputMap: {regression: 'trendPrChannel450_2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 500, degree: 2}, outputMap: {regression: 'trendPrChannel500_2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 550, degree: 2}, outputMap: {regression: 'trendPrChannel550_2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 600, degree: 2}, outputMap: {regression: 'trendPrChannel600_2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 650, degree: 2}, outputMap: {regression: 'trendPrChannel650_2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 700, degree: 2}, outputMap: {regression: 'trendPrChannel700_2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 750, degree: 2}, outputMap: {regression: 'trendPrChannel750_2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 800, degree: 2}, outputMap: {regression: 'trendPrChannel800_2'}},
    {study: studies.PolynomialRegressionChannel, inputs: {length: 850, degree: 2}, outputMap: {regression: 'trendPrChannel850_2'}}
];

var configurationOptions = {
    ema200: [true, false],
    ema100: [true, false],
    ema50: [true, false],
    sma13: [true, false],
    rsi: [
        null,
        {rsi: 'rsi7', overbought: 77, oversold: 23},
        {rsi: 'rsi7', overbought: 80, oversold: 20},
        {rsi: 'rsi5', overbought: 80, oversold: 20},
        {rsi: 'rsi2', overbought: 95, oversold: 5}
    ],
    prChannel: [
        null,
        {upper: 'prChannelUpper100_2_19', lower: 'prChannelLower100_2_19'},
        {upper: 'prChannelUpper100_3_19', lower: 'prChannelLower100_3_19'},
        {upper: 'prChannelUpper100_4_19', lower: 'prChannelLower100_4_19'},
        {upper: 'prChannelUpper100_2_195', lower: 'prChannelLower100_2_195'},
        {upper: 'prChannelUpper100_3_195', lower: 'prChannelLower100_3_195'},
        {upper: 'prChannelUpper100_4_195', lower: 'prChannelLower100_4_195'},
        {upper: 'prChannelUpper100_2_20', lower: 'prChannelLower100_2_20'},
        {upper: 'prChannelUpper100_3_20', lower: 'prChannelLower100_3_20'},
        {upper: 'prChannelUpper100_4_20', lower: 'prChannelLower100_4_20'},
        {upper: 'prChannelUpper100_2_21', lower: 'prChannelLower100_2_21'},
        {upper: 'prChannelUpper100_3_21', lower: 'prChannelLower100_3_21'},
        {upper: 'prChannelUpper100_4_21', lower: 'prChannelLower100_4_21'},
        {upper: 'prChannelUpper100_2_215', lower: 'prChannelLower100_2_215'},
        {upper: 'prChannelUpper100_3_215', lower: 'prChannelLower100_3_215'},
        {upper: 'prChannelUpper100_4_215', lower: 'prChannelLower100_4_215'},
        {upper: 'prChannelUpper200_2_215', lower: 'prChannelLower200_2_215'},
        {upper: 'prChannelUpper200_3_215', lower: 'prChannelLower200_3_215'},
        {upper: 'prChannelUpper200_4_215', lower: 'prChannelLower200_4_215'},
        {upper: 'prChannelUpper200_2_19', lower: 'prChannelLower200_2_19'},
        {upper: 'prChannelUpper200_3_19', lower: 'prChannelLower200_3_19'},
        {upper: 'prChannelUpper200_4_19', lower: 'prChannelLower200_4_19'},
        {upper: 'prChannelUpper200_2_195', lower: 'prChannelLower200_2_195'},
        {upper: 'prChannelUpper200_3_195', lower: 'prChannelLower200_3_195'},
        {upper: 'prChannelUpper200_4_195', lower: 'prChannelLower200_4_195'},
        {upper: 'prChannelUpper200_2_20', lower: 'prChannelLower200_2_20'},
        {upper: 'prChannelUpper200_3_20', lower: 'prChannelLower200_3_20'},
        {upper: 'prChannelUpper200_4_20', lower: 'prChannelLower200_4_20'},
        {upper: 'prChannelUpper200_2_21', lower: 'prChannelLower200_2_21'},
        {upper: 'prChannelUpper200_3_21', lower: 'prChannelLower200_3_21'},
        {upper: 'prChannelUpper200_4_21', lower: 'prChannelLower200_4_21'},
        {upper: 'prChannelUpper250_2_19', lower: 'prChannelLower250_2_19'},
        {upper: 'prChannelUpper250_3_19', lower: 'prChannelLower250_3_19'},
        {upper: 'prChannelUpper250_4_19', lower: 'prChannelLower250_4_19'},
        {upper: 'prChannelUpper250_2_195', lower: 'prChannelLower250_2_195'},
        {upper: 'prChannelUpper250_3_195', lower: 'prChannelLower250_3_195'},
        {upper: 'prChannelUpper250_4_195', lower: 'prChannelLower250_4_195'},
        {upper: 'prChannelUpper250_2_20', lower: 'prChannelLower250_2_20'},
        {upper: 'prChannelUpper250_3_20', lower: 'prChannelLower250_3_20'},
        {upper: 'prChannelUpper250_4_20', lower: 'prChannelLower250_4_20'},
        {upper: 'prChannelUpper250_2_21', lower: 'prChannelLower250_2_21'},
        {upper: 'prChannelUpper250_3_21', lower: 'prChannelLower250_3_21'},
        {upper: 'prChannelUpper250_4_21', lower: 'prChannelLower250_4_21'},
        {upper: 'prChannelUpper250_2_215', lower: 'prChannelLower250_2_215'},
        {upper: 'prChannelUpper250_3_215', lower: 'prChannelLower250_3_215'},
        {upper: 'prChannelUpper250_4_215', lower: 'prChannelLower250_4_215'},
        {upper: 'prChannelUpper300_2_215', lower: 'prChannelLower300_2_215'},
        {upper: 'prChannelUpper300_3_215', lower: 'prChannelLower300_3_215'},
        {upper: 'prChannelUpper300_4_215', lower: 'prChannelLower300_4_215'},
        {upper: 'prChannelUpper300_2_19', lower: 'prChannelLower300_2_19'},
        {upper: 'prChannelUpper300_3_19', lower: 'prChannelLower300_3_19'},
        {upper: 'prChannelUpper300_4_19', lower: 'prChannelLower300_4_19'},
        {upper: 'prChannelUpper300_2_195', lower: 'prChannelLower300_2_195'},
        {upper: 'prChannelUpper300_3_195', lower: 'prChannelLower300_3_195'},
        {upper: 'prChannelUpper300_4_195', lower: 'prChannelLower300_4_195'},
        {upper: 'prChannelUpper300_2_20', lower: 'prChannelLower300_2_20'},
        {upper: 'prChannelUpper300_3_20', lower: 'prChannelLower300_3_20'},
        {upper: 'prChannelUpper300_4_20', lower: 'prChannelLower300_4_20'},
        {upper: 'prChannelUpper300_2_21', lower: 'prChannelLower300_2_21'},
        {upper: 'prChannelUpper300_3_21', lower: 'prChannelLower300_3_21'},
        {upper: 'prChannelUpper300_4_21', lower: 'prChannelLower300_4_21'}
    ],
    trendPrChannel: [
        null,
        {regression: 'trendPrChannel200_2'},
        {regression: 'trendPrChannel300_2'},
        {regression: 'trendPrChannel400_2'},
        {regression: 'trendPrChannel450_2'},
        {regression: 'trendPrChannel500_2'},
        {regression: 'trendPrChannel550_2'},
        {regression: 'trendPrChannel600_2'},
        {regression: 'trendPrChannel650_2'},
        {regression: 'trendPrChannel700_2'},
        {regression: 'trendPrChannel750_2'},
        {regression: 'trendPrChannel800_2'},
        {regression: 'trendPrChannel850_2'}
    ]
};

function Reversals(symbol) {
    this.constructor = Reversals;
    Base.call(this, 'Reversals', symbol);

    // Prepare studies for use.
    this.prepareStudies(studyDefinitions);

    // Prepare all optimization configurations.
    this.configurations = this.buildConfigurations(configurationOptions);
}

// Create a copy of the Base "class" prototype for use in this "class."
Reversals.prototype = Object.create(Base.prototype);

Reversals.prototype.optimize = function(data, investment, profitability, done) {
    var self = this;

    // Prepare all data in advance for use.
    self.prepareStudyData(data, function() {
        // Ensure memory is released.
        data = null;

        Base.prototype.optimize.call(self, self.configurations, investment, profitability, done);
    });
};

module.exports = Reversals;
