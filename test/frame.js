var assert = require('assert')
  , stream = require('stream')
  , octetFrame = require('..')
;

describe('Octet-Frame', function () {
    
    it('should add a frame method and `data` event listener', function () {
        var echo = octetFrame(new stream.PassThrough());
        
        assert.ok(echo.frame);
        assert.equal(echo.listeners('data').length, 1);
    });
    
    it('should not add the frame method if `writable` is false', function () {
        var echo = octetFrame(new stream.PassThrough(), { writable: false });
        
        assert.ok(!echo.frame);
    });
    
    it('should not listen for `data` events if `readable` is false', function () {
        var echo = octetFrame(new stream.PassThrough(), { readable: false });
        
        assert.equal(echo.listeners('data').length, 0);
    });
    
    it('should frame a simple message', function (done) {
        
        var echo = octetFrame(new stream.PassThrough());
        
        echo.on('frame', function (buf) {
            assert.equal(buf.toString(), 'hello world');
            done();
        });
        
        echo.frame('hello world');
        
    });
    
    it('should buffer small chunks into a full frame', function (done) {
        var echo = octetFrame(new stream.PassThrough())
          , message = 'hello world'
          , buf = new Buffer(message)
          , size = new Buffer(4)
        ;
        
        echo.on('frame', function (buf) {
            assert.equal(buf.toString(), message);
            done();
        });
        
        size.writeUInt32BE(buf.length, 0);
        
        buf = Buffer.concat([size, buf]);
        
        for (var i = 0; i < buf.length; i += 1)(function (i) {
            setTimeout(function () {
                echo.write(buf.slice(i, i + 1));
            }, 10 * i);
        })(i);
        
    });
    
    it('should not error if `maxFrameSize` is not exceeded', function (done) {
        var echo = octetFrame(new stream.PassThrough(), { maxFrameSize: 11 });
        
        echo.on('frame', function (buf) {
            done();
        });
        
        echo.frame('hello world');
        
    });
    
    it('should error if `maxFrameSize` is exceeded on the writable stream', function (done) {
        var echo = octetFrame(new stream.PassThrough(), { maxFrameSize: 10 });
        
        echo.on('frame', function () {
            done('Should not have emitted a `frame` event');
        });
        
        echo.on('error', function (err) {
            assert.equal(err, 'Max frame size exceeded');
            done();
        });
        
        echo.frame('hello world');
    });
    
    it('should error if `maxFrameSize` is exceeded on the readable stream', function (done) {
        
        var echo = octetFrame(new stream.PassThrough(), { writable: false, maxFrameSize: 10 })
          , message = 'hello world'
          , buf = new Buffer(message)
          , size = new Buffer(4)
        ;
        
        echo.on('frame', function (buf) {
            done('Should not have emitted a `frame` event');
        });
        
        echo.on('error', function (err) {
            assert.equal(err, 'Max frame size exceeded');
            done();
        });
        
        // manually write message to avoid error on writable stream
        size.writeUInt32BE(buf.length, 0);
        
        echo.write(size);
        echo.write(buf);
        
    });
    
    it('should properly encode frames when `frameEncoding` is set', function (done) {
        var echo = octetFrame(new stream.PassThrough(), { frameEncoding: 'base64' })
          , msg = new Buffer('hello world').toString('base64')
        ;
        
        echo.on('frame', function (str) {
            assert.equal(str, msg)
            done();
        });
        
        echo.frame(msg);
    });
    
    it('should error if `stream.setEncoding` is used', function (done) {
        
        var echo = octetFrame(new stream.PassThrough());
        
        echo.setEncoding('utf8');
        
        echo.on('frame', function () {
            done('Should not have emitted a `frame` event');
        });
        
        echo.on('error', function (err) {
            assert.equal(err, 'The received chunk is not a Buffer.  Do not use `setEncoding` on the stream');
            done();
        });
        
        echo.frame('hello world');
        
    });
    
});
