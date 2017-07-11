var url = require('url');

module.exports = function getInterface(iface, apiKey, proxy) {
  function request(httpmethod, method, version, args, callback) {
    if (apiKey)
      args.key = apiKey;
    
    var data = Object.keys(args).map(function(key) {
      var value = args[key];
      if (Array.isArray(value))
        return value.map(function(value, index) {
          return key + '[' + index + ']=' + value;
        }).join('&');
      else if (Buffer.isBuffer(value))
        return key + '=' + value.toString('hex').replace(/../g, '%$&');
      else
        return key + '=' + encodeURIComponent(value);
    }).join('&');
    

    if (proxy) {
        var urlParsed = url.parse(proxy);
        console.log('web api use proxy', proxy);
        var options = {
            host: urlParsed.hostname,
            port: urlParsed.port,
            path: 'https://api.steampowered.com/' + iface + '/' + method + '/v' + version,
            method: httpmethod
        };
    }else{
        var options = {
            hostname: 'api.steampowered.com',
            path: '/' + iface + '/' + method + '/v' + version,
            method: httpmethod
        };
    }
    
    if (httpmethod == 'GET')
      options.path += '/?' + data;
    else
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      };
    
    var req = require('https').request(options, function(res) {
      if (res.statusCode != 200) {
        callback(res.statusCode);
        return;
      }
      var data = '';
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        callback(res.statusCode, JSON.parse(data));
      });
    });
    
    req.on('error', function() {
      request(httpmethod, method, version, args, callback);
    });
    
    if (httpmethod == 'POST')
      req.end(data);
    else
      req.end();
  }
  
  return {
    get: request.bind(null, 'GET'),
    post: request.bind(null, 'POST')
  };
};
