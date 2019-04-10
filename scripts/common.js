var path = require('path');
var fs = require('fs');

module.exports = {
    loadConfigEtree: function(ctx) {
        var et = require('elementtree');
        var configXMLPath = path.join(ctx.opts.projectRoot, 'config.xml');
        var configData = fs.readFileSync(configXMLPath).toString();

        return et.parse(configData);
    },
    addClinicRecordsToXcode: function (ctx, appName) {
        var xcode = require('xcode');

        var srcPath = path.join(ctx.opts.projectRoot, 'plugins/com.telerik.plugins.healthkit/src/ios');
        var projPath = path.join(ctx.opts.projectRoot, 'platforms/ios', appName + '.xcodeproj/project.pbxproj');
        var xcodeProj = xcode.project(projPath);
        var clinicalRecordsHeader = path.join(srcPath, 'HealthKitClinicalRecords.h');
        var clinicalRecordsSource = path.join(srcPath, 'HealthKitClinicalRecords.m');

        xcodeProj.parseSync();

        if (!xcodeProj.hasFile(clinicalRecordsHeader)) {
          xcodeProj.addHeaderFile(clinicalRecordsHeader);
        }
        if (!xcodeProj.hasFile(clinicalRecordsSource)) {
          xcodeProj.addSourceFile(clinicalRecordsSource);
        }

        fs.writeFileSync(projPath, xcodeProj.writeSync());
    },
    getClinicalRecordsReadPermissions: function(ctx, etree) {
        var isMeteorProject = ctx.opts.projectRoot.indexOf('/.meteor/') > -1;
        var savedClinicalReadPermission = this.getSavedClinicalRecordsReadPermissions(etree);

        if (ctx.cmdLine.indexOf('CLINICAL_READ_PERMISSION') < 0 &&
            savedClinicalReadPermission.length < 1  &&
            !isMeteorProject) {
          console.log('CLINICAL_READ_PERMISSION was not provided');
          return null;
        }

        if (isMeteorProject) {
          var meteorProjectPath = ctx.opts.projectRoot.split('/.meteor/')[0];
          var mobileConfigPath = path.join(meteorProjectPath, 'mobile-config.js');
          var mobileConfigData = fs.readFileSync(mobileConfigPath, 'utf8');
          var re = /CLINICAL_READ_PERMISSION?:\s*["|'](.*)['|"]/g;
          var matches = re.exec(mobileConfigData);
          if (matches && matches.length > 1) {
            usageDescription = matches[1];
          } else {
            console.log('CLINICAL_READ_PERMISSION was not provided');
            return null;
          }
        } else if (savedClinicalReadPermission.length > 0) {
          usageDescription = savedClinicalReadPermission[0].get('value');
        } else {
          usageDescription = ctx.cmdLine.split('CLINICAL_READ_PERMISSION=')[1].split('--')[0].trim();
        }

        return usageDescription;
    },
    getAppName: function(etree) {
        return etree.findtext('./name');
    },
    getSavedClinicalRecordsReadPermissions: function(etree) {
        return etree.findall('./plugin/variable[@name="CLINICAL_READ_PERMISSION"]');
    }
};
