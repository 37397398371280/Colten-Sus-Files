(function (root) {
  "use strict";

  // Minimal ES3-compatible Promise/callback helper (no native Promise required)
  function Deferred() {
    this._done = [];
    this._fail = [];
    this._state = "pending";
    this._value = undefined;
  }

  Deferred.prototype.resolve = function (val) {
    var i;
    if (this._state !== "pending") {
      return;
    }
    this._state = "fulfilled";
    this._value = val;
    for (i = 0; i < this._done.length; i++) {
      this._done[i](val);
    }
  };

  Deferred.prototype.reject = function (err) {
    var i;
    if (this._state !== "pending") {
      return;
    }
    this._state = "rejected";
    this._value = err;
    for (i = 0; i < this._fail.length; i++) {
      this._fail[i](err);
    }
  };

  Deferred.prototype.then = function (onFulfilled, onRejected) {
    var next = new Deferred();
    var self = this;

    function handleFulfilled(val) {
      var res;
      if (typeof onFulfilled === "function") {
        try {
          res = onFulfilled(val);
          next.resolve(res);
        } catch (e) {
          next.reject(e);
        }
      } else {
        next.resolve(val);
      }
    }

    function handleRejected(err) {
      var res;
      if (typeof onRejected === "function") {
        try {
          res = onRejected(err);
          next.resolve(res);
        } catch (e) {
          next.reject(e);
        }
      } else {
        next.reject(err);
      }
    }

    if (this._state === "fulfilled") {
      handleFulfilled(this._value);
    } else if (this._state === "rejected") {
      handleRejected(this._value);
    } else {
      this._done.push(handleFulfilled);
      this._fail.push(handleRejected);
    }

    return next;
  };

  // Create an HTTP transport using XHR or IE ActiveX fallback
  function createXHR() {
    var progIds = ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP.3.0", "Microsoft.XMLHTTP"];
    var i;
    if (typeof root.XMLHttpRequest !== "undefined") {
      return new root.XMLHttpRequest();
    }
    if (typeof root.ActiveXObject !== "undefined") {
      for (i = 0; i < progIds.length; i++) {
        try {
          return new root.ActiveXObject(progIds[i]);
        } catch (e) {}
      }
    }
    return null;
  }

  function buildQueryString(params) {
    var parts = [];
    var key;
    if (!params) {
      return "";
    }
    for (key in params) {
      if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
        parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key])));
      }
    }
    return parts.join("&");
  }

  function appendQuery(url, params) {
    var qs = buildQueryString(params);
    if (!qs) {
      return url;
    }
    return url + (url.indexOf("?") === -1 ? "?" : "&") + qs;
  }

  // Main library namespace
  var LegacyNet = {
    version: "1.0.0-es3",
    capabilities: {
      fetch: typeof root.fetch === "function",
      xhr: createXHR() !== null,
      webSocket: typeof root.WebSocket === "function",
      rtcPeerConnection: typeof root.RTCPeerConnection === "function"
    },

    // Unified HTTP request: prefers fetch, falls back to XHR/ActiveX
    request: function (opts, callback) {
      var d = new Deferred();
      var method = (opts.method || "GET").toUpperCase();
      var url = appendQuery(opts.url, opts.params);
      var headers = opts.headers || {};
      var body = opts.body;
      var xhr;
      var headerKey;

      function finishOk(payload) {
        if (typeof callback === "function") {
          callback(null, payload);
        }
        d.resolve(payload);
      }

      function finishErr(err) {
        if (typeof callback === "function") {
          callback(err, null);
        }
        d.reject(err);
      }

      if (typeof body === "object" && body !== null) {
        if (typeof JSON !== "undefined" && typeof JSON.stringify === "function") {
          body = JSON.stringify(body);
          if (!headers["Content-Type"] && !headers["content-type"]) {
            headers["Content-Type"] = "application/json";
          }
        }
      }

      if (typeof root.fetch === "function" && opts.transport !== "xhr") {
        root.fetch(url, {
          method: method,
          headers: headers,
          body: method === "GET" || method === "HEAD" ? undefined : body
        }).then(function (res) {
          return res.text().then(function (text) {
            finishOk({
              status: res.status,
              ok: res.ok,
              body: text,
              transport: "fetch"
            });
          });
        }, function (err) {
          finishErr(err);
        });
        return d;
      }

      xhr = createXHR();
      if (!xhr) {
        finishErr(new Error("No HTTP transport available in this runtime."));
        return d;
      }

      xhr.open(method, url, true);
      for (headerKey in headers) {
        if (headers.hasOwnProperty(headerKey)) {
          xhr.setRequestHeader(headerKey, headers[headerKey]);
        }
      }

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            finishOk({
              status: xhr.status,
              ok: true,
              body: xhr.responseText,
              transport: "xhr"
            });
          } else {
            finishErr({
              status: xhr.status,
              ok: false,
              body: xhr.responseText,
              transport: "xhr"
            });
          }
        }
      };

      try {
        xhr.send(method === "GET" || method === "HEAD" ? null : body);
      } catch (sendErr) {
        finishErr(sendErr);
      }

      return d;
    },

    // WebSocket wrapper when supported by host
    connectSocket: function (url, protocols) {
      var d = new Deferred();
      var ws;
      if (typeof root.WebSocket !== "function") {
        d.reject(new Error("WebSocket is not supported by this host environment."));
        return d;
      }
      ws = protocols ? new root.WebSocket(url, protocols) : new root.WebSocket(url);
      ws.onopen = function (ev) {
        d.resolve({ socket: ws, event: ev });
      };
      ws.onerror = function (ev) {
        d.reject({ socket: ws, event: ev });
      };
      return d;
    },

    // WebRTC DataChannel helper when RTCPeerConnection is available in host
    createDataChannelPeer: function (rtcConfig, label, channelOpts) {
      var d = new Deferred();
      var pc;
      var channel;
      if (typeof root.RTCPeerConnection !== "function") {
        d.reject(new Error("RTCPeerConnection is not supported by this ES3/host environment."));
        return d;
      }
      pc = new root.RTCPeerConnection(rtcConfig || {});
      channel = pc.createDataChannel(label || "data", channelOpts || {});
      channel.onopen = function () {
        d.resolve({ peerConnection: pc, dataChannel: channel });
      };
      channel.onerror = function (err) {
        d.reject(err);
      };
      return d;
    }
  };

  root.LegacyNet = LegacyNet;
})(typeof window !== "undefined" ? window : this);
