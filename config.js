const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const config = {
    development: {
      port: 3001,
      DATABASE: 'mongodb+srv://rajeshtruematrix:<PASSWORD>@cluster0.oozunu0.mongodb.net/?retryWrites=true&w=majority',
      // Other development-specific configurations
    },
    production: {
      port: process.env.PORT || 8080,
      DATABASE: process.env.DATABASE || 'mongodb+srv://rajeshtruematrix:<PASSWORD>@cluster0.oozunu0.mongodb.net/?retryWrites=true&w=majority',
      // Other production-specific configurations
    },
  };
  
  module.exports = process.env.NODE_ENV === 'production' ? config.production : config.development;