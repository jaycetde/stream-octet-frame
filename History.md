## 0.0.3 (2014-01-26)

Features:

  - add History.md
  - add License.md
  - rename README.md to Readme.md (no need to shout)
  - update Readme.md (clean up and reorganize)

## 0.0.2 (2014-01-08)

Features:

  - check type of stream before adding methods (readable or writable)
  - add options for only attaching on a readable or writable stream
  - add frame encoding to automatically encode readable buffers to strings
  - add unit test coverage

Bugfixes:

  - use `writeUInt32BE` instead of `writeInt32BE` (all messages have a positive length)
  

## 0.0.1 (2014-01-02)

Initial commit (I don't know why I didn't start with 0.0.0)