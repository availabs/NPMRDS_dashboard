module.exports = function (shipit) {
  require('shipit-deploy')(shipit);

  shipit.initConfig({
    
    default: {
      workspace: '/tmp/npmrds',
      deployTo: '~/prod/npmrds',
      repositoryUrl: 'https://github.com/availabs/NPMRDS_dashboard.git',
      ignores: ['.git', 'node_modules'],
      keepReleases: 2,
      key: 'avail-aws-east.pem',
      shallowClone: true,

    },

    production: {
      servers: 'ubuntu@ec2-52-4-179-156.compute-1.amazonaws.com'
    }
  
  });

  shipit.task('link', function () {
    shipit.remote('ln -s ~/prod/npmrds/node_modules ~/prod/npmrds/current');
    shipit.remote('ln -s ~/prod/npmrds/bower_components ~/prod/npmrds/current/assets');
  });
};