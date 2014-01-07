var MAX_FRAME_ERR = 'Max frame size exceeded'
  , NON_BUFFER_ERR = 'The received chunk is not a Buffer.  Do not use `setEncoding` on the stream'

var defaults = {
    maxFrameSize: 1024,
    readable: true,
    writable: true
};

module.exports = octetFraming;

function octetFraming(stream, options) {
    
    options = setDefaults(options, defaults);
    
    // expose for future modifications
    stream.maxFrameSize = stream.maxFrameSize || options.maxFrameSize;
    stream.frameEncoding = stream.frameEncoding || options.frameEncoding;
    
    // Stream is writable, create frame method
    if (stream.writable && options.writable) {
        
        stream.frame = function (chunk, encoding) {
            chunk = Buffer.isBuffer(chunk) ? chunk : new Buffer(chunk, encoding || stream.frameEncoding);

            var sizeBuffer = new Buffer(4);

            // no check for if maxFrameSize > Math.pow(2, 32) - 1.  Hopefully won't need to implement one

            if (chunk.length > stream.maxFrameSize) return stream.emit('error', MAX_FRAME_ERR);

            sizeBuffer.writeUInt32BE(chunk.length, 0);

            stream.write(sizeBuffer);
            stream.write(chunk);
        };

    }
    
    // Stream is readable, attach data listener
    if (stream.readable && options.readable) {
        stream._octetSizeBuffer = new Buffer(4);
        stream._octetSizeOffset = 0;
        stream._octetFrameOffset = 0;
        
        stream.on('data', function frameChunk(chunk) {

            if (!Buffer.isBuffer(chunk)) {
                stream.removeListener('data', frameChunk);
                return stream.emit('error', NON_BUFFER_ERR);
            }

            if (!stream._octetFrameBuffer) { // No frame buffer yet, building size buffer
                if (chunk.length + stream._octetSizeOffset >= stream._octetSizeBuffer.length) { // This chunk will fill the size buffer
                    chunk.copy(stream._octetSizeBuffer, stream._octetSizeOffset, 0, stream._octetSizeBuffer.length - stream._octetSizeOffset);
                    chunk = chunk.slice(stream._octetSizeBuffer.length - stream._octetSizeOffset);

                    var size = stream._octetSizeBuffer.readUInt32BE(0);

                    if (size > stream.maxFrameSize) {
                        stream.removeListener('data', frameChunk);
                        return stream.emit('error', MAX_FRAME_ERR);
                    }

                    stream._octetFrameBuffer = new Buffer(size);
                    stream._octetFrameOffset = 0;
                    stream._octetSizeOffset = 0;
                } else { // Waiting for additional size chunks
                    chunk.copy(stream._octetSizeBuffer, stream._octetSizeOffset);
                    stream._octetSizeOffset += chunk.length;
                    return;
                }
            }

            chunk.copy(stream._octetFrameBuffer, stream._octetFrameOffset);

            if (stream._octetFrameOffset + chunk.length >= stream._octetFrameBuffer.length) { // This chunk will fill the frame buffer
                chunk = chunk.slice(stream._octetFrameBuffer.length - stream._octetFrameOffset);
                // May throw an exception if `stream.frameEncoding` is an unknown encoding
                stream.emit('frame', stream.frameEncoding ? stream._octetFrameBuffer.toString(stream.frameEncoding) : stream._octetFrameBuffer);
                stream._octetFrameBuffer = null;
                frameChunk(chunk);
            }

            stream._octetFrameOffset += chunk.length;

        });
    }

    return stream;

}

function setDefaults(options, defaults) {
    options = options || {};

    for (var prop in defaults) {
        if (typeof options[prop] === 'undefined')
            options[prop] = defaults[prop];
    }
    
    return options;
}
