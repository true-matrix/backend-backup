module.exports = {
  apps : [{
    name: 'messenger-api',
    script: 'server.js',
    watch: '.',
    env:{
    NODE_ENV: 'production',
    port: 3001,
    DATABASE: 'mongodb+srv://rajeshtruematrix:<PASSWORD>@cluster0.oozunu0.mongodb.net/?retryWrites=true&w=majority',
   },
  
  },
],

  deploy : {
    production : {
      user : 'cooktim',
      host : '68.178.173.95',
      ref  : 'origin/main',
      repo : 'git@github.com:true-matrix/backend-backup.git',
      path : 'C:/Users/cooktim/New-folder/backend-backup',
      'post-deploy' : 'pm2 startOrRestart ecosystem.config.js --env production'
    }
  }
};
