const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    filename:{ 
      type: String
    },
    originalname:{ 
      type: String
    },
    path:{ 
      type: String
    },
  });

const File =new mongoose.model('File', fileSchema);
module.exports = File;
