# stream-octet-frame

Uses octet counting to frame data through a stream

Data sent using the method `frame` will be prefixed with the number of bytes in the data.
All chunks recieved on the stream will be buffered until the full frame has been recieved, and then it
will be emitted as a `frame` event.

```javascript

var octetFrame = require('stream-octet-frame')
  , net = require('net')
;

var server = net.createServer(socket) {
    socket.on('frame', function (buf) {
        console.log('frame recieved: ', buf.toString());
    });
    
    octetFrame(socket, { maxFrameSize: 64 });
    
    socket.frame('write this frame to the socket');
});

```

## Installation

```bash
npm install stream-octet-frame
```

## Dependencies

none

## API

### octetFrame(stream, [options])

Adds `frame` function to `stream` and listens for octet framed data

#### options.maxFrameSize (default: `1024`)

Maximum number of bytes in each frame

Maximum value is Maximum value is 4294967295 (Math.pow(2, 32) - 1, 4gb - 1byte)

This may also be set on the stream:

```javascript
stream.maxFrameSize = 1024;
```

#### options.readable (default: `true`)

Set to `true` to buffer data into frames

#### options.writable (default: `true`)

Set to `true` to add a `frame` method to `stream`

#### options.frameEncoding

Readable stream - will call `.toString(frameEncoding)` on the frame buffer before emitting the `frame` event

Writable stream - will use as the default encoding when converting a string into a buffer.  Specifying an
encoding when calling `frame` will overwrite this value

This may also be set on the stream:

```javascript
stream.frameEncoding = 'utf8';
```

### stream.frame(data, [encoding])

Converts `data` to a buffer with `encoding`, frames the data, and write the frame and data to the stream

data - A string or buffer
encoding - Encoding to use when converting `data` to a buffer.  Overrides `options.frameEncoding`

Only available if stream is writable and options.writable is `true`

## Events (emitted on the stream)

### 'frame'

Emitted when a full data frame has been received.

Arguments:

  - data - A `Buffer` containing the data frame. If `options.frameEncoding` is set, a `String` will be passes with the specified encoding

## Limitations

  - Do not use `stream.setEncoding()` when using this to frame data.  The encoding will try to convert the raw bytes into strings,
mangling the octet count and data byte cound in the process.  The [stream docs](http://nodejs.org/api/stream.html#stream_readable_setencoding_encoding)
suggest to always use `setEncoding` when reading the data as strings, but this is just to buffer parts of the data enough to
properly encode multi-byte characters.  When framing data, all of the data will be buffered and encoding should work as expected.
  - The stream will automatically start to be consumed when using this method.