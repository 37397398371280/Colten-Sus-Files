(function (root) {
  "use strict";

  function getPeerConnectionCtor() {
    if (typeof root.RTCPeerConnection === "function") {
      return root.RTCPeerConnection;
    }
    if (typeof root.webkitRTCPeerConnection === "function") {
      return root.webkitRTCPeerConnection;
    }
    if (typeof root.mozRTCPeerConnection === "function") {
      return root.mozRTCPeerConnection;
    }
    return null;
  }

  // Feature-based ECMAScript & host capability detection
  function detectCapabilities() {
    var hasPromise = typeof root.Promise === "function";
    var hasArrayIsArray = typeof Array.isArray === "function";
    var hasObjectAssign = typeof Object.assign === "function";
    var hasJSON = typeof root.JSON !== "undefined" &&
      typeof root.JSON.parse === "function" &&
      typeof root.JSON.stringify === "function";
    var hasFetch = typeof root.fetch === "function";
    var hasAbortController = typeof root.AbortController === "function";
    var hasWebSocket = typeof root.WebSocket === "function";
    var rtcCtor = getPeerConnectionCtor();

    var edition = "ES3";
    if (hasPromise || hasObjectAssign || hasFetch) {
      edition = "ES6+/ES2026-capable";
    } else if (hasJSON || hasArrayIsArray) {
      edition = "ES5+";
    }

    return {
      detectedEdition: edition,
      es5ArrayIsArray: hasArrayIsArray,
      es5Json: hasJSON,
      es6Promise: hasPromise,
      es6ObjectAssign: hasObjectAssign,
      fetch: hasFetch,
      xhr: createXHR() !== null,
      abortController: hasAbortController,
      webSocket: hasWebSocket,
      rtcPeerConnection: rtcCtor !== null,
      rtcPrefixed: typeof root.RTCPeerConnection !== "function" && rtcCtor !== null
    };
  }

  function isArrayValue(val) {
    if (typeof Array.isArray === "function") {
      return Array.isArray(val);
    }
    return val instanceof Array;
  }

  function mergeObjects() {
    var target = {};
    var i;
    var key;
    var src;

    if (typeof Object.assign === "function") {
      var args = [target];
      for (i = 0; i < arguments.length; i++) {
        if (arguments[i] && typeof arguments[i] === "object") {
          args.push(arguments[i]);
        }
      }
      return Object.assign.apply(Object, args);
    }

    for (i = 0; i < arguments.length; i++) {
      src = arguments[i];
      if (src && typeof src === "object") {
        for (key in src) {
          if (src.hasOwnProperty(key)) {
            target[key] = src[key];
          }
        }
      }
    }
    return target;
  }

  // ES3-safe JSON helpers (uses native JSON when available, falls back cleanly)
  function escapeString(str) {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  }

  function es3Stringify(val) {
    var type = typeof val;
    var i;
    var parts;
    var key;

    if (val === null || type === "boolean" || type === "number") {
      return String(val);
    }
    if (type === "string") {
      return '"' + escapeString(val) + '"';
    }
    if (isArrayValue(val)) {
      parts = [];
      for (i = 0; i < val.length; i++) {
        parts.push(es3Stringify(val[i]));
      }
      return "[" + parts.join(",") + "]";
    }
    if (type === "object") {
      parts = [];
      for (key in val) {
        if (val.hasOwnProperty(key) && typeof val[key] !== "function" && typeof val[key] !== "undefined") {
          parts.push('"' + escapeString(key) + '":' + es3Stringify(val[key]));
        }
      }
      return "{" + parts.join(",") + "}";
    }
    return "null";
  }

  function es3Parse(text) {
    if (typeof text !== "string") {
      return text;
    }
    if (!/^[\],:{}\s]*$/.test(
      text
        .replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
        .replace(/(?:^|:|,)(?:\s*\[)+/g, "")
    )) {
      throw new SyntaxError("Invalid JSON string");
    }
    return (new Function("return (" + text + ")"))();
  }

  function safeStringify(val) {
    if (typeof root.JSON !== "undefined" && typeof root.JSON.stringify === "function") {
      return root.JSON.stringify(val);
    }
    return es3Stringify(val);
  }

  function safeParse(text) {
    if (typeof root.JSON !== "undefined" && typeof root.JSON.parse === "function") {
      return root.JSON.parse(text);
    }
    return es3Parse(text);
  }

  // Deferred wrapper that mirrors native Promise when present and stays ES3-safe when absent
  function Deferred(onAbort) {
    this._done = [];
    this._fail = [];
    this._state = "pending";
    this._value = undefined;
    this._aborted = false;
    this._onAbort = onAbort || null;
  }

  Deferred.prototype.resolve = function (val) {
    var i;
    if (this._state !== "pending" || this._aborted) {
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
    if (this._state !== "pending" || this._aborted) {
      return;
    }
    this._state = "rejected";
    this._value = err;
    for (i = 0; i < this._fail.length; i++) {
      this._fail[i](err);
    }
  };

  Deferred.prototype.abort = function (reason) {
    var err;
    var i;
    if (this._state !== "pending" || this._aborted) {
      return;
    }
    this._aborted = true;
    if (typeof this._onAbort === "function") {
      try {
        this._onAbort(reason);
      } catch (e) {}
    }
    err = new Error(reason || "Request aborted");
    err.code = "ABORTED";
    this._state = "rejected";
    this._value = err;
    for (i = 0; i < this._fail.length; i++) {
      this._fail[i](err);
    }
  };

  Deferred.prototype.then = function (onFulfilled, onRejected) {
    var next = new Deferred();

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

  Deferred.prototype["catch"] = function (onRejected) {
    return this.then(null, onRejected);
  };

  // Optional bridge to a native ES6+ Promise (e.g. for async/await in modern runtimes)
  Deferred.prototype.toNativePromise = function () {
    var self = this;
    if (typeof root.Promise !== "function") {
      return null;
    }
    return new root.Promise(function (resolve, reject) {
      self.then(
        function (val) { resolve(val); },
        function (err) { reject(err); }
      );
    });
  };

  // HTTP transport factory: XHR or IE ActiveX fallback
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

  function isRetryableError(err) {
    if (!err) {
      return false;
    }
    if (err.code === "ABORTED") {
      return false;
    }
    if (err.timeout === true) {
      return true;
    }
    if (typeof err.status === "number") {
      return err.status === 408 || err.status === 429 || (err.status >= 500 && err.status < 600);
    }
    return true;
  }

  var capabilities = detectCapabilities();

  var LegacyNet = {
    version: "1.3.0-multi",
    capabilities: capabilities,
    json: {
      stringify: safeStringify,
      parse: safeParse
    },
    utils: {
      isArray: isArrayValue,
      merge: mergeObjects
    },
    limits: {
      missingProtocols:
        "ES3 JavaScript cannot create UDP sockets, run ICE/STUN/TURN negotiation, or perform DTLS/SRTP encryption for WebRTC on a runtime that lacks native WebRTC support.",
      securityEnforcedByHost:
        "Even with a fallback transport, Same-Origin Policy, CORS, and TLS requirements are enforced by the host environment, not bypassed by the library."
    },

    request: function (opts, callback) {
      var method = (opts.method || "GET").toUpperCase();
      var url = appendQuery(opts.url, opts.params);
      var maxRetries = typeof opts.retries === "number" && opts.retries >= 0 ? opts.retries : 0;
      var retryDelay = typeof opts.retryDelay === "number" && opts.retryDelay >= 0 ? opts.retryDelay : 250;
      var timeoutMs = typeof opts.timeout === "number" && opts.timeout > 0 ? opts.timeout : 0;
      var attempt = 0;
      var activeCleanup = null;
      var timerId = null;
      var retryTimerId = null;

      var d = new Deferred(function () {
        if (timerId !== null && typeof root.clearTimeout === "function") {
          root.clearTimeout(timerId);
        }
        if (retryTimerId !== null && typeof root.clearTimeout === "function") {
          root.clearTimeout(retryTimerId);
        }
        if (typeof activeCleanup === "function") {
          activeCleanup();
        }
      });

      function clearTimers() {
        if (timerId !== null && typeof root.clearTimeout === "function") {
          root.clearTimeout(timerId);
          timerId = null;
        }
      }

      function emitFinalSuccess(payload) {
        clearTimers();
        if (d._aborted) {
          return;
        }
        if (typeof callback === "function") {
          callback(null, payload);
        }
        d.resolve(payload);
      }

      function emitFinalError(err) {
        clearTimers();
        if (d._aborted) {
          return;
        }
        if (typeof callback === "function") {
          callback(err, null);
        }
        d.reject(err);
      }

      function runAttempt() {
        var headers = mergeObjects({}, opts.headers);
        var body = opts.body;
        var settled = false;
        var controller;
        var xhr;
        var key;
        var fetchOpts;

        if (d._aborted) {
          return;
        }

        if (typeof body === "object" && body !== null) {
          body = safeStringify(body);
          if (!headers["Content-Type"] && !headers["content-type"]) {
            headers["Content-Type"] = "application/json";
          }
        }

        function handleAttemptFailure(err) {
          if (settled || d._aborted) {
            return;
          }
          settled = true;
          clearTimers();

          if (attempt < maxRetries && isRetryableError(err) && typeof root.setTimeout === "function") {
            attempt++;
            retryTimerId = root.setTimeout(function () {
              runAttempt();
            }, retryDelay * attempt);
            return;
          }
          emitFinalError(err);
        }

        function handleAttemptSuccess(payload) {
          if (settled || d._aborted) {
            return;
          }
          settled = true;
          clearTimers();
          if (opts.parseJson === true && typeof payload.body === "string") {
            try {
              payload.json = safeParse(payload.body);
            } catch (parseErr) {
              handleAttemptFailure(parseErr);
              return;
            }
          }
          emitFinalSuccess(payload);
        }

        if (timeoutMs > 0 && typeof root.setTimeout === "function") {
          timerId = root.setTimeout(function () {
            var tErr = new Error("Request timed out after " + timeoutMs + "ms");
            tErr.timeout = true;
            if (typeof activeCleanup === "function") {
              activeCleanup();
            }
            handleAttemptFailure(tErr);
          }, timeoutMs);
        }

        if (typeof root.fetch === "function" && opts.transport !== "xhr") {
          fetchOpts = {
            method: method,
            headers: headers,
            body: method === "GET" || method === "HEAD" ? undefined : body
          };

          if (typeof root.AbortController === "function") {
            controller = new root.AbortController();
            fetchOpts.signal = controller.signal;
            activeCleanup = function () {
              try {
                controller.abort();
              } catch (e) {}
            };
          } else {
            activeCleanup = null;
          }

          root.fetch(url, fetchOpts).then(
            function (res) {
              return res.text().then(function (text) {
                if (!res.ok) {
                  handleAttemptFailure({
                    status: res.status,
                    ok: false,
                    body: text,
                    transport: "fetch"
                  });
                } else {
                  handleAttemptSuccess({
                    status: res.status,
                    ok: true,
                    body: text,
                    transport: "fetch"
                  });
                }
              });
            },
            function (err) {
              handleAttemptFailure(err);
            }
          );
          return;
        }

        xhr = createXHR();
        if (!xhr) {
          handleAttemptFailure(new Error("No HTTP transport available in this runtime."));
          return;
        }

        activeCleanup = function () {
          try {
            xhr.abort();
          } catch (e) {}
        };

        xhr.open(method, url, true);
        for (key in headers) {
          if (headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, headers[key]);
          }
        }

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              handleAttemptSuccess({
                status: xhr.status,
                ok: true,
                body: xhr.responseText,
                transport: "xhr"
              });
            } else {
              handleAttemptFailure({
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
          handleAttemptFailure(sendErr);
        }
      }

      runAttempt();
      return d;
    },

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

    createDataChannelPeer: function (rtcConfig, label, channelOpts) {
      var d = new Deferred();
      var RtcCtor = getPeerConnectionCtor();
      var pc;
      var channel;

      if (!RtcCtor) {
        d.reject(new Error("RTCPeerConnection is not supported by this host environment."));
        return d;
      }
      pc = new RtcCtor(rtcConfig || {});
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
