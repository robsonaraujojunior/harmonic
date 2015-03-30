/* jshint mocha: true */

import { spawn, exec } from 'child_process';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { sync as rimrafSync } from 'rimraf';
import { sync as mkdirpSync } from 'mkdirp';
import 'should';
import Parser from '../bin/parser';
import { isHarmonicProject, getConfig, titleToFilename } from '../bin/helpers';
import { postspath } from '../bin/config';

var parser = new Parser(),
    harmonicBin = join(__dirname, '../../entry_points/harmonic'),
    testDir = join(__dirname, 'site'),
    stdoutWrite = process.stdout.write;

before(function() {
    rimrafSync(testDir);
    mkdirpSync(testDir);
});

after(function() {
    rimrafSync(testDir);
});

function disableStdout() {
    process.stdout.write = function() {};
}
function enableStdout() {
    process.stdout.write = stdoutWrite;
}

describe('CLI', function() {
    it('should display an error for unknown commands', function(done) {
        exec('node "' + harmonicBin + '" foobarbaz', function(error, stdout, stderr) {
            error.code.should.equal(1);
            stderr.should.containEql('foobarbaz');
            done();
        });
    });

    it('should init a new Harmonic site', function(done) {
        var harmonic = spawn('node', [harmonicBin, 'init', testDir]);
        harmonic.stdin.setEncoding('utf8');
        harmonic.stdout.setEncoding('utf8');

        harmonic.stdout.on('data', function(data) {
            if (data.indexOf('successfully created') === -1) {
                harmonic.stdin.write('\n');
                return;
            }
            harmonic.stdin.end();
        });

        harmonic.on('close', function() {
            isHarmonicProject(testDir).should.be.true;
            done();
        });
    });

    it('should build the Harmonic site', function(done) {
        var harmonic = spawn('node', [harmonicBin, 'build', testDir]);
        harmonic.stdin.setEncoding('utf8');
        harmonic.stdout.setEncoding('utf8');

        harmonic.on('close', function() {
            existsSync(join(testDir, 'public')).should.be.true;
            done();
        });
    });

    // We need to refactor this test after the themes changes
    // it('should create and build a new post', function(done) {
    //     var config = getConfig(testDir),
    //         langs = config.i18n.languages,
    //         title = 'new_post test',
    //         fileName = titleToFilename(title),
    //         harmonic = spawn('node', [harmonicBin, 'new_post', '--no-open', title, testDir]);
    //     harmonic.stdin.setEncoding('utf8');
    //     harmonic.stdout.setEncoding('utf8');

    //     new Promise(function(resolve) {
    //         harmonic.on('close', function() {
    //             langs.forEach(function(lang) {
    //                 readFileSync(
    //                     join(testDir, postspath, lang, fileName)
    //                 ).toString().should.containEql(title);
    //             });
    //             resolve();
    //         });
    //     }).then(function() {
    //         var harmonicBuild = spawn('node', [harmonicBin, 'build', testDir]);
    //         harmonicBuild.stdin.setEncoding('utf8');
    //         harmonicBuild.stdout.setEncoding('utf8');
    //         return new Promise(function(resolve) {
    //             harmonicBuild.on('close', function() {
    //                 var date = new Date(),
    //                     year = String(date.getFullYear()),
    //                     month = ('0' + (date.getMonth() + 1)).slice(-2),
    //                     slug = fileName.replace(/\.md$/, '');
    //                 langs.forEach(function(lang) {
    //                     var langSegment = lang === config.i18n.default ? '.' : lang;
    //                     readFileSync(join(testDir, 'public', langSegment, year, month,
    //                         slug, 'index.html')).toString().should.containEql(title);
    //                 });
    //                 resolve();
    //             });
    //         });
    //     }).then(done);
    // });

    // write this test once #73 is resolved
    it('should create and build a new page');
});

describe('helpers', function() {

    it('.isHarmonicProject() should return whether the CWD is a Harmonic site', function() {
        disableStdout();
        var result = isHarmonicProject(__dirname);
        enableStdout();
        result.should.be.false;
        isHarmonicProject(testDir).should.be.true;
    });

    it('.titleToFilename() should transform a post/page title into a filename', function() {
        titleToFilename('Hello World!').should.equal('hello-world.md');
    });
});

// We need to refactor this test after the themes changes
// describe('parser', function() {

//     it('.getConfig() should merge the template\'s config into the main config', function() {
//         var config = getConfig(testDir),
//             templateConfigPath = join(
//                 testDir, 'src/templates', config.template, 'harmonic.json'
//             ),
//             templateConfig = { customData: 'test' },
//             mergedConfig;

//         writeFileSync(templateConfigPath, JSON.stringify(templateConfig));
//         mergedConfig = parser.getConfig(testDir);
//         mergedConfig.should.containDeep(templateConfig);
//         mergedConfig.should.eql(Object.assign({}, config, templateConfig));
//     });
// });
