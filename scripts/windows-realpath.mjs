import fs from "node:fs";
// Some Windows sandboxes reject native realpath for otherwise readable files.
// Use Node's standard, symlink-aware resolver only for this native EPERM case.
// This changes tooling compatibility, not filesystem permissions.
if (process.platform === "win32") {
  const native = fs.realpathSync.native;
  fs.realpathSync.native = function (path, options) {
    try {
      return native(path, options);
    } catch (e) {
      if (e.code === "EPERM") return fs.realpathSync(path, options);
      throw e;
    }
  };
}
