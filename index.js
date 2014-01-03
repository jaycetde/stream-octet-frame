module.exports = octetFraming;

function octetFraming(stream, options) {
    
    options = options || {};
    
    stream.maxFrameSize = options.maxFrameSize || 1024;
    
    stream._octetSizeBuffer = new Buffer(4);
    stream._octetSizeOffset = 0;
    stream._octetFrameOffset = 0;
    
    stream.frame = function (chunk, encoding) {
        chunk = Buffer.isBuffer(chunk) ? chunk : new Buffer(chunk, encoding);
        
        var sizeBuffer = new Buffer(4);
        
        if (chunk.length > stream.maxFrameSize) return stream.emit('error', 'Max frame size exceeded');
        
        sizeBuffer.writeInt32BE(chunk.length, 0);
        
        stream.write(sizeBuffer);
        stream.write(chunk);
    }
    
    stream.on('data', function frameChunk(chunk) {
        if (!stream._octetFrameBuffer) { // No frame buffer yet, building size buffer
            if (chunk.length + stream._octetSizeOffset >= stream._octetSizeBuffer.length) { // This chunk will fill the size buffer
                chunk.copy(stream._octetSizeBuffer, stream._octetSizeOffset, 0, stream._octetSizeBuffer.length - stream._octetSizeOffset);
                chunk = chunk.slice(stream._octetSizeBuffer.length - stream._octetSizeOffset);
                
                var size = stream._octetSizeBuffer.readInt32BE(0);
                
                if (size > stream.maxFrameSize) return stream.emit('error', 'Max frame size exceeded');
                
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
            stream.emit('frame', stream._octetFrameBuffer);
            stream._octetFrameBuffer = null;
            frameChunk(chunk);
        }
        
        stream._octetFrameOffset += chunk.length;
        
    });
    
}