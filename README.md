Uses octet counting to frame messages through a stream

## Installation

```bash
npm install stream-octet-frame
```

## Description

Messages send using the method `frame` will be prefixed with the number of bytes in the message.
All chunks recieved on the stream will be buffered until the full frame has been recieved, and then it
will be emitted as a `frame` event

Note - The stream will automatically start to be consumed when using this method.

## Usage

```javascript

var octetFrame = require('stream-octet-frame')
  , net = require('net')
;

var server = net.createServer(socket) {
    socket.on('frame', function (buf) {
        console.log('frame recieved: ', buf);
    });
    
    octetFrame(socket, { maxFrameSize: 64 });
    
    socket.frame('write this frame to the socket');
});

```

## License

MIT