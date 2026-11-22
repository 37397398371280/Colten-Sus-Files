(function (root) {
  "use strict";

  function scheduleAsync(fn) {
    if (typeof root.setTimeout === "function") {
      root.setTimeout(fn, 0);
    } else {
      fn();
    }
  }

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

  function isArrayValue(val) {
    if (typeof Array.isArray === "function") {
      return Array.isArray(val);
    }
    return val instanceof Array;
  }

  function isBinaryOrFormData(val) {
    if (!val || typeof val !== "object") {
      return false;
    }
    if (typeof root.FormData !== "undefined" && val instanceof root.FormData) {
      return true;
    }
    if (typeof root.Blob !== "undefined" && val instanceof root.Blob) {
      return true;
    }
    if (typeof root.ArrayBuffer !== "undefined" && val instanceof root.ArrayBuffer) {
      return true;
    }
    if (typeof root.ArrayBuffer !== "undefined" && typeof root.ArrayBuffer.isView === "function" && root.ArrayBuffer.isView(val)) {
      return true;
    }
    return false;
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

  // ES3-safe JSON helpers with reviver support
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

  function applyReviver(holder, key, reviver) {
    var val = holder[key];
    var k;
    var newVal;

    if (val && typeof val === "object") {
      if (isArrayValue(val)) {
        for (k = 0; k < val.length; k++) {
          newVal = applyReviver(val, String(k), reviver);
          if (newVal === undefined) {
            val[k] = undefined;
          } else {
            val[k] = newVal;
          }
        }
      } else {
        for (k in val) {
          if (val.hasOwnProperty(k)) {
            newVal = applyReviver(val, k, reviver);
            if (newVal === undefined) {
              delete val[k];
            } else {
              val[k] = newVal;
            }
          }
        }
      }
    }

    return reviver.call(holder, key, val);
  }

  function es3Parse(text, reviver) {
    var parsed;
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
    parsed = (new Function("return (" + text + ")"))();
    if (typeof reviver === "function") {
      return applyReviver({ "": parsed }, "", reviver);
    }
    return parsed;
  }

  function safeStringify(val) {
    if (typeof root.JSON !== "undefined" && typeof root.JSON.stringify === "function") {
      return root.JSON.stringify(val);
    }
    return es3Stringify(val);
  }

  function safeParse(text, reviver) {
    if (typeof root.JSON !== "undefined" && typeof root.JSON.parse === "function") {
      return typeof reviver === "function" ? root.JSON.parse(text, reviver) : root.JSON.parse(text);
    }
    return es3Parse(text, reviver);
  }

  // Promises/A+-style Deferred with async reaction dispatch and abort support
  function Deferred(onAbort) {
    this._handlers = [];
    this._state = "pending";
    this._value = undefined;
    this._aborted = false;
    this._onAbort = onAbort || null;
  }

  Deferred.prototype._flush = function () {
    var self = this;
    var handlers;
    var i;

    if (this._state === "pending") {
      return;
    }
    handlers = this._handlers.slice(0);
    this._handlers = [];

    for (i = 0; i < handlers.length; i++) {
      (function (entry) {
        scheduleAsync(function () {
          var cb = self._state === "fulfilled" ? entry.onFulfilled : entry.onRejected;
          var res;

          if (typeof cb !== "function") {
            if (self._state === "fulfilled") {
              entry.next.resolve(self._value);
            } else {
              entry.next.reject(self._value);
            }
            return;
          }

          try {
            res = cb(self._value);
            if (res && typeof res.then === "function") {
              res.then(
                function (v) { entry.next.resolve(v); },
                function (e) { entry.next.reject(e); }
              );
            } else {
              entry.next.resolve(res);
            }
          } catch (err) {
            entry.next.reject(err);
          }
        });
      })(handlers[i]);
    }
  };

  Deferred.prototype.resolve = function (val) {
    if (this._state !== "pending" || this._aborted) {
      return;
    }
    if (val === this) {
      this.reject(new TypeError("A promise cannot be resolved with itself."));
      return;
    }
    if (val && (typeof val === "object" || typeof val === "function") && typeof val.then === "function") {
      var self = this;
      try {
        val.then(
          function (v) { self.resolve(v); },
          function (e) { self.reject(e); }
        );
      } catch (err) {
        self.reject(err);
      }
      return;
    }
    this._state = "fulfilled";
    this._value = val;
    this._flush();
  };

  Deferred.prototype.reject = function (err) {
    if (this._state !== "pending" || this._aborted) {
      return;
    }
    this._state = "rejected";
    this._value = err;
    this._flush();
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
    this._flush();
  };

  Deferred.prototype.then = function (onFulfilled, onRejected) {
    var next = new Deferred();
    this._handlers.push({
      onFulfilled: onFulfilled,
      onRejected: onRejected,
      next: next
    });
    if (this._state !== "pending") {
      this._flush();
    }
    return next;
  };

  Deferred.prototype["catch"] = function (onRejected) {
    return this.then(null, onRejected);
  };

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

  function readStreamChunks(stream, onChunk, onDone) {
    var reader;
    if (!stream || typeof stream.getReader !== "function") {
      if (typeof onDone === "function") {
        onDone(new Error("ReadableStream reader not available."));
      }
      return;
    }
    reader = stream.getReader();
    function pump() {
      reader.read().then(
        function (step) {
          if (step.done) {
            if (typeof onDone === "function") {
              onDone(null);
            }
            return;
          }
          if (typeof onChunk === "function") {
            onChunk(step.value);
          }
          pump();
        },
        function (err) {
          if (typeof onDone === "function") {
            onDone(err);
          }
        }
      );
    }
    pump();
  }

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
      rtcPrefixed: typeof root.RTCPeerConnection !== "function" && rtcCtor !== null,
      formData: typeof root.FormData !== "undefined",
      blob: typeof root.Blob !== "undefined",
      arrayBuffer: typeof root.ArrayBuffer !== "undefined",
      streams: typeof root.ReadableStream !== "undefined"
    };
  }

  var capabilities = detectCapabilities();

  var LegacyNet = {
    version: "1.4.0-multi",
    capabilities: capabilities,
    json: {
      stringify: safeStringify,
      parse: safeParse
    },
    utils: {
      isArray: isArrayValue,
      merge: mergeObjects,
      isBinaryOrFormData: isBinaryOrFormData,
      readStreamChunks: readStreamChunks
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
      var responseType = opts.responseType || "text";
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

        if (typeof body === "object" && body !== null && !isBinaryOrFormData(body)) {
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
          if ((opts.parseJson === true || responseType === "json") && typeof payload.body === "string") {
            try {
              payload.json = safeParse(payload.body, opts.reviver);
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
              var stream = res.body || null;
              var readPromise;

              if (responseType === "arraybuffer" && typeof res.arrayBuffer === "function") {
                readPromise = res.arrayBuffer();
              } else if (responseType === "blob" && typeof res.blob === "function") {
                readPromise = res.blob();
              } else {
                readPromise = res.text();
              }

              return readPromise.then(function (data) {
                var resultObj = {
                  status: res.status,
                  ok: res.ok,
                  body: data,
                  stream: stream,
                  readStream: function (onChunk, onDone) {
                    return readStreamChunks(stream, onChunk, onDone);
                  },
                  transport: "fetch"
                };
                if (!res.ok) {
                  handleAttemptFailure(resultObj);
                } else {
                  handleAttemptSuccess(resultObj);
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

        if (responseType === "arraybuffer" || responseType === "blob") {
          try {
            xhr.responseType = responseType;
          } catch (rtErr) {}
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
          var rawData;
          if (xhr.readyState === 4) {
            rawData = (responseType === "arraybuffer" || responseType === "blob") && xhr.response !== undefined
              ? xhr.response
              : xhr.responseText;

            if (xhr.status >= 200 && xhr.status < 300) {
              handleAttemptSuccess({
                status: xhr.status,
                ok: true,
                body: rawData,
                stream: null,
                readStream: function (onChunk, onDone) {
                  if (typeof onChunk === "function") {
                    onChunk(rawData);
                  }
                  if (typeof onDone === "function") {
                    onDone(null);
                  }
                },
                transport: "xhr"
              });
            } else {
              handleAttemptFailure({
                status: xhr.status,
                ok: false,
                body: rawData,
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
    },

    // WebRTC SDP offer/answer & ICE candidate signaling session
    createSignalingSession: function (opts) {
      var cfg = opts || {};
      var sendSignal = cfg.sendSignal;
      var RtcCtor = getPeerConnectionCtor();
      var pc;
      var pendingCandidates = [];
      var remoteSet = false;
      var listeners = {
        signal: [],
        iceCandidate: [],
        track: [],
        dataChannel: [],
        connectionState: []
      };

      if (!RtcCtor) {
        throw new Error("RTCPeerConnection is not supported by this host environment.");
      }
      if (typeof sendSignal !== "function") {
        throw new Error("createSignalingSession requires a sendSignal(message) function.");
      }

      pc = new RtcCtor(cfg.rtcConfig || {});

      function emit(eventName, payload) {
        var list = listeners[eventName] || [];
        var i;
        for (i = 0; i < list.length; i++) {
          list[i](payload);
        }
      }

      function flushCandidates() {
        var i;
        if (!remoteSet) {
          return;
        }
        for (i = 0; i < pendingCandidates.length; i++) {
          try {
            pc.addIceCandidate(pendingCandidates[i]);
          } catch (e) {}
        }
        pendingCandidates = [];
      }

      pc.onicecandidate = function (ev) {
        var msg;
        if (ev && ev.candidate) {
          msg = { type: "candidate", candidate: ev.candidate };
          emit("iceCandidate", ev.candidate);
          emit("signal", msg);
          sendSignal(msg);
        }
      };

      pc.ondatachannel = function (ev) {
        emit("dataChannel", ev.channel);
      };

      pc.ontrack = function (ev) {
        emit("track", ev);
      };

      pc.onconnectionstatechange = function () {
        emit("connectionState", pc.connectionState);
      };

      function createOffer(offerOpts) {
        var d = new Deferred();
        var offerPromise = pc.createOffer(offerOpts || {});

        if (offerPromise && typeof offerPromise.then === "function") {
          offerPromise.then(
            function (desc) {
              return pc.setLocalDescription(desc).then(function () {
                var msg = { type: "offer", sdp: desc };
                emit("signal", msg);
                sendSignal(msg);
                d.resolve(desc);
              });
            },
            function (err) { d.reject(err); }
          );
        } else {
          pc.createOffer(
            function (desc) {
              pc.setLocalDescription(
                desc,
                function () {
                  var msg = { type: "offer", sdp: desc };
                  emit("signal", msg);
                  sendSignal(msg);
                  d.resolve(desc);
                },
                function (err) { d.reject(err); }
              );
            },
            function (err) { d.reject(err); },
            offerOpts || {}
          );
        }
        return d;
      }

      function createAnswer(answerOpts) {
        var d = new Deferred();
        var ansPromise = pc.createAnswer(answerOpts || {});

        if (ansPromise && typeof ansPromise.then === "function") {
          ansPromise.then(
            function (desc) {
              return pc.setLocalDescription(desc).then(function () {
                var msg = { type: "answer", sdp: desc };
                emit("signal", msg);
                sendSignal(msg);
                d.resolve(desc);
              });
            },
            function (err) { d.reject(err); }
          );
        } else {
          pc.createAnswer(
            function (desc) {
              pc.setLocalDescription(
                desc,
                function () {
                  var msg = { type: "answer", sdp: desc };
                  emit("signal", msg);
                  sendSignal(msg);
                  d.resolve(desc);
                },
                function (err) { d.reject(err); }
              );
            },
            function (err) { d.reject(err); },
            answerOpts || {}
          );
        }
        return d;
      }

      function handleSignal(msg) {
        var d = new Deferred();
        var parsed = typeof msg === "string" ? safeParse(msg) : msg;
        var desc;
        var CandidateCtor;

        if (!parsed || !parsed.type) {
          d.reject(new Error("Invalid signaling message."));
          return d;
        }

        if (parsed.type === "offer" || parsed.type === "answer") {
          desc = typeof root.RTCSessionDescription === "function"
            ? new root.RTCSessionDescription(parsed.sdp)
            : parsed.sdp;

          if (typeof pc.setRemoteDescription === "function") {
            var setRem = pc.setRemoteDescription(desc);
            if (setRem && typeof setRem.then === "function") {
              setRem.then(
                function () {
                  remoteSet = true;
                  flushCandidates();
                  if (parsed.type === "offer" && cfg.autoAnswer !== false) {
                    createAnswer().then(
                      function (ans) { d.resolve(ans); },
                      function (err) { d.reject(err); }
                    );
                  } else {
                    d.resolve(desc);
                  }
                },
                function (err) { d.reject(err); }
              );
            } else {
              pc.setRemoteDescription(
                desc,
                function () {
                  remoteSet = true;
                  flushCandidates();
                  d.resolve(desc);
                },
                function (err) { d.reject(err); }
              );
            }
          }
          return d;
        }

        if (parsed.type === "candidate" && parsed.candidate) {
          CandidateCtor = root.RTCIceCandidate || root.webkitRTCIceCandidate || root.mozRTCIceCandidate;
          var cand = CandidateCtor ? new CandidateCtor(parsed.candidate) : parsed.candidate;
          if (!remoteSet) {
            pendingCandidates.push(cand);
            d.resolve(cand);
          } else {
            var addRes = pc.addIceCandidate(cand);
            if (addRes && typeof addRes.then === "function") {
              addRes.then(function () { d.resolve(cand); }, function (err) { d.reject(err); });
            } else {
              d.resolve(cand);
            }
          }
          return d;
        }

        d.reject(new Error("Unsupported signaling message type: " + parsed.type));
        return d;
      }

      return {
        peerConnection: pc,
        createOffer: createOffer,
        createAnswer: createAnswer,
        handleSignal: handleSignal,
        createDataChannel: function (label, channelOpts) {
          return pc.createDataChannel(label || "data", channelOpts || {});
        },
        on: function (eventName, fn) {
          if (listeners[eventName] && typeof fn === "function") {
            listeners[eventName].push(fn);
          }
        },
        close: function () {
          try {
            pc.close();
          } catch (e) {}
        }
      };
    }
  };

  root.LegacyNet = LegacyNet;
})(typeof window !== "undefined" ? window : this);
