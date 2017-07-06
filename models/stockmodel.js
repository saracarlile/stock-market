var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
 
var StockSchema = new Schema({
    dataset_code: String,
    name: String
});
 
mongoose.model('Stock', StockSchema);