const fs = require("fs");
const path = require("path");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function copyFileSync(source, target) {
  var targetFile = target;

  // If target is a directory, a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory() ) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
  var files = [];

  // Check if folder needs to be created or integrated
  var targetFolder = path.join(target, path.basename(source));
  
  ensureDir(targetFolder);

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      var curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}

ensureDir('../build');

["components", "systems", "prototype", "assets", "importers", "utils"].forEach(function (source) {
  ensureDir(source);
  copyFolderRecursiveSync(source, '../build');
});

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(function(file) {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
    ? walkSync(path.join(dir, file), filelist)
    : filelist.concat(path.join(dir, file));
  });

  return filelist;
}

function buildExport(dir) {
  const files = walkSync(dir).map(p => {
    const filePathArr = `${p.substr(dir.length + 1)}`.split('/');
    return filePathArr[filePathArr.length - 1];
  });

  const names = files.map(f => {
    return f.split('.')[0].split('_').map(s => s[0].toUpperCase() + s.slice(1)).join('');
  });

  const paths = walkSync(dir).map(c => `"./${dir}/${c.substr(dir.length + 1)}"`);

  const imports = [];
  for (let i = 0; i < names.length; i++) {
    imports.push(`import ${names[i]} from ${paths[i]};`);
  }

  if (names.length) {
    return imports.join('\n') + '\n\nexport {\n    ' + names.join(',\n    ') + ',\n};\n';
  } else {
    return 'export {};\n';
  }
}

fs.writeFileSync('../build/component_imports.js', buildExport('components'));
fs.writeFileSync('../build/system_imports.js', buildExport('systems'));
fs.writeFileSync('../build/importer_imports.js', buildExport('importers'));

const proto = walkSync("prototype");
let protoBuild = "const prototypes = {};\n\n";

for (let p of proto) {
  const fileData = fs.readFileSync(p).toString();
  const prototypeName = p.split('.')[0].slice(p.indexOf('/') + 1);

  protoBuild += `prototypes["${prototypeName}"] = ${fileData};\n\n`;
}

protoBuild += "Object.freeze(prototypes);\n\nexport default prototypes;\n";

fs.writeFileSync('../build/prototypes_build.js', protoBuild);

const assets = walkSync("assets").map(a => `"${a.substr(7)}"`);

let dataFile = "";
dataFile += `const Assets = Object.freeze([${assets}]);\n\n`;
dataFile += "export { Assets };\n";

fs.writeFileSync("../build/data.js", dataFile);
fs.copyFileSync("config.js", "../build/config.js");
fs.copyFileSync("hardly.js", "../build/hardly.js");
fs.copyFileSync("logger.js", "../build/logger.js");
fs.copyFileSync("ecs.js", "../build/ecs.js");
