(function (root) {
  "use strict";

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
    if (val instanceof Array) {
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
    // Controlled evaluation for ES3 environments without native JSON.parse
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
    if (typeof JSON !== "undefined" && typeof JSON.stringify === "function") {
      return JSON.stringify(val);
    }
    return es3Stringify(val);
  }

  function safeParse(text) {
    if (typeof JSON !== "undefined" && typeof JSON.parse === "function") {
      return JSON.parse(text);
    }
    return es3Parse(text);
  }

  // Minimal ES3-compatible Promise/callback helper with abort support
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
    for (var i = 0; i < this._fail.length; i++) {
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

  var LegacyNet = {
    version: "1.1.0-es3",
    json: {
      stringify: safeStringify,
      parse: safeParse
    },
    capabilities: {
      fetch: typeof root.fetch === "function",
      xhr: createXHR() !== null,
      webSocket: typeof root.WebSocket === "function",
      rtcPeerConnection: typeof root.RTCPeerConnection === "function",
      abortController: typeof root.AbortController === "function"
    },
    // Explicit runtime & security boundaries enforced by the host environment
    limits: {
      missingProtocols:
        "ES3 JavaScript cannot create UDP sockets, run ICE/STUN/TURN negotiation, or perform DTLS/SRTP encryption for WebRTC on a runtime that lacks native WebRTC support.",
      securityEnforcedByHost:
        "Even with a fallback transport, Same-Origin Policy, CORS, and TLS requirements are enforced by the host environment, not bypassed by the library."
    },

    // Unified HTTP request with timeout, retries, abort, and ES3 JSON support
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
        var headers = {};
        var key;
        var body = opts.body;
        var settled = false;
        var controller;
        var xhr;

        if (d._aborted) {
          return;
        }

        if (opts.headers) {
          for (key in opts.headers) {
            if (opts.headers.hasOwnProperty(key)) {
              headers[key] = opts.headers[key];
            }
          }
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

        // Fetch path (with AbortController when available)
        if (typeof root.fetch === "function" && opts.transport !== "xhr") {
          var fetchOpts = {
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

        // XHR / ActiveX path
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
