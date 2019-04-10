module.exports = function (ctx) {

  try {
    var fs = require('fs'),
      path = require('path'),
      configXMLPath = path.join(ctx.opts.projectRoot, 'config.xml'),
      et = require('elementtree'),
      common = require('./common');

    var configData = fs.readFileSync(configXMLPath).toString();
    var etree = common.loadConfigEtree(ctx);

    var usageDescription = common.getClinicalRecordsReadPermissions(ctx, etree);

    if (usageDescription == null) {
      return;
    }

    console.log('*** Installing HealthKitClinicalRecords ***');
    console.log('CLINICAL_READ_PERMISSION = ', usageDescription);

    common.addClinicRecordsToXcode(ctx, common.getAppName(etree));

    // enable health records
    var tagPlatform = etree.findall('./platform[@name="ios"]');
    // ios platform exists and plugin is restored
    if (tagPlatform.length > 0 && common.getSavedClinicalRecordsReadPermissions(etree).length < 1) {
      // add CLINICAL_READ_PERMISSION text to config.xml
      var tagEditConfig = et.Element('config-file', { target: '*-Info.plist', parent: 'NSHealthClinicalHealthRecordsShareUsageDescription' });
      var tagString = et.Element('string');
      tagString.text = usageDescription;
      tagEditConfig.append(tagString);
      tagPlatform[0].append(tagEditConfig);

      // add Health Records to entitlements
      ['*Entitlements-Debug.plist', '*Entitlements-Release.plist'].forEach(function(fileName){
        var healthRecordCapabilityConfig = et.Element('config-file', { target: fileName, parent: 'com.apple.developer.healthkit.access'});
        var healthRecordArray = et.Element('array');
        var healthRecordString = et.Element('string');
        healthRecordString.text = 'health-records';
        healthRecordArray.append(healthRecordString);
        healthRecordCapabilityConfig.append(healthRecordArray);
        tagPlatform[0].append(healthRecordCapabilityConfig);
      });

      configData = etree.write({ 'indent': 4 });
      fs.writeFileSync(configXMLPath, configData);
    }

    console.log('*** DONE Installing HealthKitClinicalRecords ***');
  } catch(e) {
    console.log('healthkit after-plugin-install error, e: ', JSON.stringify(e, null, 2));
  }
};
