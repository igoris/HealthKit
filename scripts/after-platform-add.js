module.exports = function (ctx) {
    var common = require('./common');
    console.log('*** Installing HealthKitClinicalRecords into XCode ***');

    var etree = common.loadConfigEtree(ctx);

    if (common.getClinicalRecordsReadPermissions(ctx, etree) != null) {
      common.addClinicRecordsToXcode(ctx, common.getAppName(etree));
    }
};
