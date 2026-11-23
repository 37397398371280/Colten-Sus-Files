(function (root) {
  "use strict";

  function resolveGlobal(fallbackRoot) {
    if (typeof globalThis !== "undefined" && globalThis) {
      return globalThis;
    }
    if (typeof root !== "undefined" && root) {
      return root;
    }
    return this;
  }

  root = resolveGlobal(root);

  var HEX_DIGITS = "0123456789abcdef";
  var B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  function scheduleAsync(fn) {
    if (typeof root.setTimeout === "function") {
      root.setTimeout(fn, 0);
    } else {
      fn();
    }
  }

  function isArrayValue(val) {
    if (typeof Array.isArray === "function") {
      return Array.isArray(val);
    }
    return val instanceof Array;
  }

  function getKeys(obj) {
    var out = [];
    var key;
    if (!obj || typeof obj !== "object") {
      return out;
    }
    if (typeof Object.keys === "function") {
      return Object.keys(obj);
    }
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        out.push(key);
      }
    }
    return out;
  }

  function mergeObjects() {
    var target = {};
    var i;
    var j;
    var keys;
    var src;
    var k;

    for (i = 0; i < arguments.length; i++) {
      src = arguments[i];
      if (src && typeof src === "object") {
        keys = getKeys(src);
        for (j = 0; j < keys.length; j++) {
          k = keys[j];
          target[k] = src[k];
        }
      }
    }
    return target;
  }

  function randomHexToken(byteLen) {
    var len = typeof byteLen === "number" && byteLen > 0 ? byteLen : 8;
    var out = "";
    var i;
    var b;
    for (i = 0; i < len; i++) {
      b = Math.floor(Math.random() * 256) & 0xff;
      out += HEX_DIGITS.charAt((b >> 4) & 0x0f) + HEX_DIGITS.charAt(b & 0x0f);
    }
    return out;
  }

  function createStunTransactionId() {
    return randomHexToken(12);
  }

  function getNativePeerConnectionCtor() {
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

  function getNativeSessionDescriptionCtor() {
    if (typeof root.RTCSessionDescription === "function") {
      return root.RTCSessionDescription;
    }
    if (typeof root.webkitRTCSessionDescription === "function") {
      return root.webkitRTCSessionDescription;
    }
    if (typeof root.mozRTCSessionDescription === "function") {
      return root.mozRTCSessionDescription;
    }
    return null;
  }

  function getNativeIceCandidateCtor() {
    if (typeof root.RTCIceCandidate === "function") {
      return root.RTCIceCandidate;
    }
    if (typeof root.webkitRTCIceCandidate === "function") {
      return root.webkitRTCIceCandidate;
    }
    if (typeof root.mozRTCIceCandidate === "function") {
      return root.mozRTCIceCandidate;
    }
    return null;
  }

  function createXhrInstance() {
    var progIds;
    var i;
    if (typeof root.XMLHttpRequest === "function" || typeof root.XMLHttpRequest === "object") {
      try {
        return new root.XMLHttpRequest();
      } catch (e1) {}
    }
    if (typeof root.ActiveXObject === "function" || typeof root.ActiveXObject === "object") {
      progIds = ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP.3.0", "Microsoft.XMLHTTP"];
      for (i = 0; i < progIds.length; i++) {
        try {
          return new root.ActiveXObject(progIds[i]);
        } catch (e2) {}
      }
    }
    return null;
  }

  function detectCapabilities() {
    var hasJson = typeof root.JSON === "object" && root.JSON !== null;
    var hasPromise = typeof root.Promise === "function";
    var hasArrayBuffer = typeof root.ArrayBuffer === "function";
    var hasUint8 = typeof root.Uint8Array === "function";
    var hasMap = typeof root.Map === "function";
    var hasIterator = typeof root.Iterator === "object" && root.Iterator !== null;
    var hasErrorObj = typeof root.Error === "function";
    var hasMathObj = typeof root.Math === "object" && root.Math !== null;
    var hasArrayFromAsync = typeof root.Array === "function" && typeof root.Array.fromAsync === "function";
    var hasUint8Base64 = hasUint8 && (
      typeof root.Uint8Array.fromBase64 === "function" ||
      typeof root.Uint8Array.fromHex === "function" ||
      (root.Uint8Array.prototype && (
        typeof root.Uint8Array.prototype.toBase64 === "function" ||
        typeof root.Uint8Array.prototype.toHex === "function"
      ))
    );
    var hasJsonRaw = hasJson && (
      typeof root.JSON.rawJSON === "function" ||
      typeof root.JSON.isRawJSON === "function"
    );
    var hasErrorIsError = hasErrorObj && typeof root.Error.isError === "function";
    var hasMathSumPrecise = hasMathObj && typeof root.Math.sumPrecise === "function";
    var hasMapGetOrInsert = hasMap && root.Map.prototype && (
      typeof root.Map.prototype.getOrInsert === "function" ||
      typeof root.Map.prototype.getOrInsertComputed === "function"
    );
    var hasIteratorConcat = hasIterator && typeof root.Iterator.concat === "function";

    var es5ArrayIsArray = typeof Array.isArray === "function";
    var es5ObjectKeys = typeof Object.keys === "function";
    var es5DateNow = typeof Date.now === "function";
    var es6ObjectAssign = typeof Object.assign === "function";
    var es7Includes = typeof Array.prototype.includes === "function";
    var es8ObjectEntries = typeof Object.entries === "function";
    var es10Flat = typeof Array.prototype.flat === "function";
    var es11GlobalThis = typeof globalThis !== "undefined";
    var es12ReplaceAll = typeof String.prototype.replaceAll === "function";
    var es13At = typeof Array.prototype.at === "function";
    var es14ArrayCopy = typeof Array.prototype.toSorted === "function" || typeof Array.prototype.toReversed === "function";
    var es15GroupBy = typeof Object.groupBy === "function" || (typeof Array.prototype.group === "function");
    var es16PromiseTry = hasPromise && typeof root.Promise["try"] === "function";

    var hasEs2026 = hasErrorIsError || hasMathSumPrecise || hasArrayFromAsync ||
      hasUint8Base64 || hasJsonRaw || hasMapGetOrInsert || hasIteratorConcat;

    var detectedEdition = "ES3";
    if (hasEs2026) {
      detectedEdition = "ES2026/ES17+";
    } else if (es16PromiseTry) {
      detectedEdition = "ES16/ES2025+";
    } else if (es15GroupBy) {
      detectedEdition = "ES15/ES2024+";
    } else if (es14ArrayCopy) {
      detectedEdition = "ES14/ES2023+";
    } else if (es13At) {
      detectedEdition = "ES13/ES2022+";
    } else if (es12ReplaceAll) {
      detectedEdition = "ES12/ES2021+";
    } else if (es11GlobalThis) {
      detectedEdition = "ES11/ES2020+";
    } else if (es10Flat) {
      detectedEdition = "ES10/ES2019+";
    } else if (es8ObjectEntries) {
      detectedEdition = "ES8/ES2017+";
    } else if (es7Includes) {
      detectedEdition = "ES7/ES2016+";
    } else if (hasPromise || es6ObjectAssign) {
      detectedEdition = "ES6+";
    } else if (hasJson || es5ArrayIsArray || es5ObjectKeys || es5DateNow) {
      detectedEdition = "ES5+";
    }

    var nativePc = getNativePeerConnectionCtor();
    var isStandardPc = typeof root.RTCPeerConnection === "function";

    return {
      detectedEdition: detectedEdition,
      es5ArrayIsArray: es5ArrayIsArray,
      es5Json: hasJson,
      es5ObjectKeys: es5ObjectKeys,
      es5DateNow: es5DateNow,
      es6Promise: hasPromise,
      es6ObjectAssign: es6ObjectAssign,
      es7Includes: es7Includes,
      es8ObjectEntries: es8ObjectEntries,
      es10Flat: es10Flat,
      es11GlobalThis: es11GlobalThis,
      es12ReplaceAll: es12ReplaceAll,
      es13At: es13At,
      es14ArrayCopy: es14ArrayCopy,
      es15GroupBy: es15GroupBy,
      es16PromiseTry: es16PromiseTry,
      es2026ErrorIsError: hasErrorIsError,
      es2026MathSumPrecise: hasMathSumPrecise,
      es2026FromAsync: hasArrayFromAsync,
      es2026Uint8Base64: hasUint8Base64,
      es2026JsonRaw: hasJsonRaw,
      es2026MapGetOrInsert: hasMapGetOrInsert,
      es2026IteratorConcat: hasIteratorConcat,
      fetch: typeof root.fetch === "function",
      xhr: createXhrInstance() !== null,
      abortController: typeof root.AbortController === "function",
      webSocket: typeof root.WebSocket === "function",
      rtcPeerConnection: nativePc !== null,
      rtcPrefixed: nativePc !== null && !isStandardPc,
      formData: typeof root.FormData === "function",
      blob: typeof root.Blob === "function",
      arrayBuffer: hasArrayBuffer,
      streams: typeof root.ReadableStream === "function"
    };
  }

  var capabilities = detectCapabilities();

  // =========================================================================
  // DEFERRED & ASYNC COMBINATORS
  // =========================================================================

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
            if (res && (typeof res === "object" || typeof res === "function") && typeof res.then === "function") {
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
      this.reject(new TypeError("Cannot resolve Deferred with itself"));
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
    err = new Error(reason || "Aborted");
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

  Deferred.prototype["finally"] = function (onFinally) {
    if (typeof onFinally !== "function") {
      return this.then(null, null);
    }
    return this.then(
      function (val) {
        var r = onFinally();
        if (r && typeof r.then === "function") {
          return r.then(function () { return val; });
        }
        return val;
      },
      function (err) {
        var r = onFinally();
        if (r && typeof r.then === "function") {
          return r.then(function () { throw err; });
        }
        throw err;
      }
    );
  };

  Deferred.prototype.toNativePromise = function () {
    var self = this;
    if (typeof root.Promise !== "function") {
      return null;
    }
    return new root.Promise(function (resolve, reject) {
      self.then(resolve, reject);
    });
  };

  function createDeferred(onAbort) {
    return new Deferred(onAbort);
  }

  function asDeferred(item) {
    var d = new Deferred();
    if (item && (typeof item === "object" || typeof item === "function") && typeof item.then === "function") {
      item.then(
        function (v) { d.resolve(v); },
        function (e) { d.reject(e); }
      );
    } else {
      d.resolve(item);
    }
    return d;
  }

  function allDeferred(items) {
    var d = new Deferred();
    var arr = isArrayValue(items) ? items : [];
    var results = [];
    var remaining = arr.length;
    var settled = false;
    var i;

    if (remaining === 0) {
      d.resolve([]);
      return d;
    }

    for (i = 0; i < arr.length; i++) {
      (function (idx) {
        asDeferred(arr[idx]).then(
          function (val) {
            if (settled) {
              return;
            }
            results[idx] = val;
            remaining -= 1;
            if (remaining === 0) {
              settled = true;
              d.resolve(results);
            }
          },
          function (err) {
            if (!settled) {
              settled = true;
              d.reject(err);
            }
          }
        );
      })(i);
    }

    return d;
  }

  function raceDeferred(items) {
    var d = new Deferred();
    var arr = isArrayValue(items) ? items : [];
    var settled = false;
    var i;

    for (i = 0; i < arr.length; i++) {
      asDeferred(arr[i]).then(
        function (val) {
          if (!settled) {
            settled = true;
            d.resolve(val);
          }
        },
        function (err) {
          if (!settled) {
            settled = true;
            d.reject(err);
          }
        }
      );
    }

    return d;
  }

  function anyDeferred(items) {
    var d = new Deferred();
    var arr = isArrayValue(items) ? items : [];
    var errors = [];
    var remaining = arr.length;
    var settled = false;
    var i;

    if (remaining === 0) {
      var emptyErr = new Error("All promises were rejected");
      emptyErr.errors = [];
      d.reject(emptyErr);
      return d;
    }

    for (i = 0; i < arr.length; i++) {
      (function (idx) {
        asDeferred(arr[idx]).then(
          function (val) {
            if (!settled) {
              settled = true;
              d.resolve(val);
            }
          },
          function (err) {
            if (settled) {
              return;
            }
            errors[idx] = err;
            remaining -= 1;
            if (remaining === 0) {
              settled = true;
              var agg = new Error("All promises were rejected");
              agg.errors = errors;
              d.reject(agg);
            }
          }
        );
      })(i);
    }

    return d;
  }

  function allSettledDeferred(items) {
    var d = new Deferred();
    var arr = isArrayValue(items) ? items : [];
    var outcomes = [];
    var remaining = arr.length;
    var i;

    if (remaining === 0) {
      d.resolve([]);
      return d;
    }

    for (i = 0; i < arr.length; i++) {
      (function (idx) {
        asDeferred(arr[idx]).then(
          function (val) {
            outcomes[idx] = { status: "fulfilled", value: val };
            remaining -= 1;
            if (remaining === 0) {
              d.resolve(outcomes);
            }
          },
          function (reason) {
            outcomes[idx] = { status: "rejected", reason: reason };
            remaining -= 1;
            if (remaining === 0) {
              d.resolve(outcomes);
            }
          }
        );
      })(i);
    }

    return d;
  }

  function withResolvers() {
    var d = new Deferred();
    var nativePair = (typeof root.Promise === "function" && typeof root.Promise.withResolvers === "function")
      ? root.Promise.withResolvers()
      : null;

    return {
      promise: d,
      nativePromise: nativePair ? nativePair.promise : d.toNativePromise(),
      resolve: function (v) {
        d.resolve(v);
        if (nativePair) {
          nativePair.resolve(v);
        }
      },
      reject: function (e) {
        d.reject(e);
        if (nativePair) {
          nativePair.reject(e);
        }
      }
    };
  }

  function tryCall(fn, thisArg, argsArr) {
    var d = new Deferred();
    scheduleAsync(function () {
      var res;
      if (typeof fn !== "function") {
        d.reject(new TypeError("Expected a function"));
        return;
      }
      try {
        res = fn.apply(thisArg || null, argsArr || []);
        d.resolve(res);
      } catch (err) {
        d.reject(err);
      }
    });
    return d;
  }

  function fromAsync(source, mapFn, thisArg) {
    var d = new Deferred();
    var mapper = typeof mapFn === "function" ? mapFn : null;

    if (typeof root.Array === "function" && typeof root.Array.fromAsync === "function") {
      try {
        asDeferred(root.Array.fromAsync(source, mapper, thisArg)).then(
          function (res) { d.resolve(res); },
          function (err) { d.reject(err); }
        );
        return d;
      } catch (e) {}
    }

    scheduleAsync(function () {
      var out = [];
      var i;
      var mapped;

      try {
        if (!source) {
          d.resolve([]);
          return;
        }
        if (typeof source.length === "number") {
          for (i = 0; i < source.length; i++) {
            mapped = mapper ? mapper.call(thisArg || null, source[i], i) : source[i];
            out.push(mapped);
          }
          d.resolve(out);
          return;
        }
        d.resolve([mapper ? mapper.call(thisArg || null, source, 0) : source]);
      } catch (err) {
        d.reject(err);
      }
    });

    return d;
  }

  // =========================================================================
  // JSON + RAW JSON (ES3 + ES2026)
  // =========================================================================

  function isRawJsonWrapper(val) {
    if (typeof root.JSON === "object" && root.JSON !== null && typeof root.JSON.isRawJSON === "function") {
      try {
        if (root.JSON.isRawJSON(val)) {
          return true;
        }
      } catch (e) {}
    }
    return !!(val && typeof val === "object" && typeof val.__legacyRawJson === "string");
  }

  function rawJson(rawText) {
    var text = String(rawText);
    if (typeof root.JSON === "object" && root.JSON !== null && typeof root.JSON.rawJSON === "function") {
      try {
        return root.JSON.rawJSON(text);
      } catch (e) {}
    }
    return { __legacyRawJson: text };
  }

  function es3Stringify(val) {
    var type = typeof val;
    var parts;
    var keys;
    var i;
    var k;
    var vStr;

    if (val === null || type === "undefined" || type === "boolean" || type === "number") {
      if (type === "number" && (!isFinite(val))) {
        return "null";
      }
      return String(val);
    }
    if (type === "string") {
      return '"' + val
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t") + '"';
    }
    if (isRawJsonWrapper(val)) {
      return typeof val.__legacyRawJson === "string" ? val.__legacyRawJson : String(val);
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
      keys = getKeys(val);
      for (i = 0; i < keys.length; i++) {
        k = keys[i];
        vStr = es3Stringify(val[k]);
        if (typeof vStr === "string") {
          parts.push(es3Stringify(k) + ":" + vStr);
        }
      }
      return "{" + parts.join(",") + "}";
    }
    return "null";
  }

  function applyReviver(holder, key, reviver) {
    var val = holder[key];
    var keys;
    var i;
    var k;
    var newVal;
    var ctx = { source: typeof val === "string" || typeof val === "number" ? String(val) : undefined };

    if (val && typeof val === "object") {
      if (isArrayValue(val)) {
        for (i = 0; i < val.length; i++) {
          newVal = applyReviver(val, String(i), reviver);
          if (typeof newVal === "undefined") {
            val[i] = undefined;
          } else {
            val[i] = newVal;
          }
        }
      } else {
        keys = getKeys(val);
        for (i = 0; i < keys.length; i++) {
          k = keys[i];
          newVal = applyReviver(val, k, reviver);
          if (typeof newVal === "undefined") {
            try {
              delete val[k];
            } catch (e) {
              val[k] = undefined;
            }
          } else {
            val[k] = newVal;
          }
        }
      }
    }

    return reviver.call(holder, key, val, ctx);
  }

  function es3Parse(text, reviver) {
    var str = String(text);
    var cleaned = str.replace(/"(\\.|[^"\\])*"/g, "");
    var parsed;
    var rootHolder;

    if (/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(cleaned)) {
      throw new SyntaxError("Invalid JSON input");
    }

    parsed = (new Function("return (" + str + ");"))();
    if (typeof reviver === "function") {
      rootHolder = { "": parsed };
      return applyReviver(rootHolder, "", reviver);
    }
    return parsed;
  }

  function safeStringify(val) {
    if (isRawJsonWrapper(val) && typeof val.__legacyRawJson === "string") {
      return val.__legacyRawJson;
    }
    if (typeof root.JSON === "object" && root.JSON !== null && typeof root.JSON.stringify === "function") {
      return root.JSON.stringify(val);
    }
    return es3Stringify(val);
  }

  function safeParse(text, reviver) {
    if (typeof root.JSON === "object" && root.JSON !== null && typeof root.JSON.parse === "function") {
      return root.JSON.parse(text, reviver);
    }
    return es3Parse(text, reviver);
  }

  // =========================================================================
  // UTILITIES (ES3 -> ES2026)
  // =========================================================================

  function isErrorValue(val) {
    if (typeof root.Error === "function" && typeof root.Error.isError === "function") {
      try {
        if (root.Error.isError(val)) {
          return true;
        }
      } catch (e) {}
    }
    return val instanceof Error;
  }

  function withCause(err, cause) {
    var target = isErrorValue(err) ? err : new Error(String(err || "Error"));
    if (typeof cause !== "undefined") {
      target.cause = cause;
    }
    return target;
  }

  function sumPrecise(values) {
    var sum = 0;
    var comp = 0;
    var i;
    var n;
    var y;
    var t;

    if (typeof root.Math === "object" && root.Math !== null && typeof root.Math.sumPrecise === "function") {
      try {
        return root.Math.sumPrecise(values);
      } catch (e) {}
    }

    if (!isArrayValue(values)) {
      return NaN;
    }

    for (i = 0; i < values.length; i++) {
      n = Number(values[i]);
      if (isNaN(n)) {
        return NaN;
      }
      if (!isFinite(n)) {
        sum += n;
        continue;
      }
      y = n - comp;
      t = sum + y;
      comp = (t - sum) - y;
      sum = t;
    }
    return sum;
  }

  function toHexBytes(bytesOrArr) {
    var out = "";
    var i;
    var b;
    if (typeof root.Uint8Array !== "undefined" && bytesOrArr instanceof root.Uint8Array && typeof bytesOrArr.toHex === "function") {
      return bytesOrArr.toHex();
    }
    if (!bytesOrArr || typeof bytesOrArr.length !== "number") {
      return "";
    }
    for (i = 0; i < bytesOrArr.length; i++) {
      b = Number(bytesOrArr[i]) & 0xff;
      out += HEX_DIGITS.charAt((b >> 4) & 0x0f) + HEX_DIGITS.charAt(b & 0x0f);
    }
    return out;
  }

  function fromHexBytes(hexStr) {
    var clean = String(hexStr || "").replace(/\s+/g, "");
    var out = [];
    var i;
    var byteVal;

    if (typeof root.Uint8Array === "function" && typeof root.Uint8Array.fromHex === "function") {
      try {
        return root.Uint8Array.fromHex(clean);
      } catch (e) {}
    }
    if (clean.length % 2 !== 0) {
      throw new SyntaxError("Invalid hex string length");
    }
    for (i = 0; i < clean.length; i += 2) {
      byteVal = parseInt(clean.slice(i, i + 2), 16);
      if (isNaN(byteVal)) {
        throw new SyntaxError("Invalid hex character");
      }
      out.push(byteVal);
    }
    return out;
  }

  function toBase64Bytes(bytesOrArr) {
    var out = "";
    var i;
    var b0;
    var b1;
    var b2;

    if (typeof root.Uint8Array !== "undefined" && bytesOrArr instanceof root.Uint8Array && typeof bytesOrArr.toBase64 === "function") {
      return bytesOrArr.toBase64();
    }
    if (!bytesOrArr || typeof bytesOrArr.length !== "number") {
      return "";
    }

    for (i = 0; i < bytesOrArr.length; i += 3) {
      b0 = Number(bytesOrArr[i]) & 0xff;
      b1 = (i + 1 < bytesOrArr.length) ? (Number(bytesOrArr[i + 1]) & 0xff) : null;
      b2 = (i + 2 < bytesOrArr.length) ? (Number(bytesOrArr[i + 2]) & 0xff) : null;

      out += B64_ALPHABET.charAt((b0 >> 2) & 0x3f);
      if (b1 === null) {
        out += B64_ALPHABET.charAt((b0 & 0x03) << 4);
        out += "==";
      } else if (b2 === null) {
        out += B64_ALPHABET.charAt(((b0 & 0x03) << 4) | ((b1 >> 4) & 0x0f));
        out += B64_ALPHABET.charAt((b1 & 0x0f) << 2);
        out += "=";
      } else {
        out += B64_ALPHABET.charAt(((b0 & 0x03) << 4) | ((b1 >> 4) & 0x0f));
        out += B64_ALPHABET.charAt(((b1 & 0x0f) << 2) | ((b2 >> 6) & 0x03));
        out += B64_ALPHABET.charAt(b2 & 0x3f);
      }
    }
    return out;
  }

  function fromBase64Bytes(b64Str) {
    var clean = String(b64Str || "").replace(/[\r\n\s]+/g, "");
    var out = [];
    var i;
    var c0;
    var c1;
    var c2;
    var c3;

    if (typeof root.Uint8Array === "function" && typeof root.Uint8Array.fromBase64 === "function") {
      try {
        return root.Uint8Array.fromBase64(clean);
      } catch (e) {}
    }

    for (i = 0; i < clean.length; i += 4) {
      c0 = B64_ALPHABET.indexOf(clean.charAt(i));
      c1 = B64_ALPHABET.indexOf(clean.charAt(i + 1));
      c2 = clean.charAt(i + 2) === "=" ? -1 : B64_ALPHABET.indexOf(clean.charAt(i + 2));
      c3 = clean.charAt(i + 3) === "=" ? -1 : B64_ALPHABET.indexOf(clean.charAt(i + 3));

      if (c0 < 0 || c1 < 0) {
        throw new SyntaxError("Invalid base64 input");
      }
      out.push(((c0 << 2) | (c1 >> 4)) & 0xff);
      if (c2 >= 0) {
        out.push((((c1 & 0x0f) << 4) | (c2 >> 2)) & 0xff);
      }
      if (c3 >= 0) {
        out.push((((c2 & 0x03) << 6) | c3) & 0xff);
      }
    }
    return out;
  }

  function mapGetOrInsert(mapOrObj, key, defaultValue) {
    if (mapOrObj && typeof mapOrObj.getOrInsert === "function") {
      return mapOrObj.getOrInsert(key, defaultValue);
    }
    if (mapOrObj && typeof mapOrObj.get === "function" && typeof mapOrObj.set === "function") {
      if (!mapOrObj.has(key)) {
        mapOrObj.set(key, defaultValue);
      }
      return mapOrObj.get(key);
    }
    if (!mapOrObj.hasOwnProperty(key)) {
      mapOrObj[key] = defaultValue;
    }
    return mapOrObj[key];
  }

  function mapGetOrInsertComputed(mapOrObj, key, callbackFn) {
    var computed;
    if (mapOrObj && typeof mapOrObj.getOrInsertComputed === "function") {
      return mapOrObj.getOrInsertComputed(key, callbackFn);
    }
    if (mapOrObj && typeof mapOrObj.get === "function" && typeof mapOrObj.set === "function") {
      if (!mapOrObj.has(key)) {
        computed = typeof callbackFn === "function" ? callbackFn(key) : callbackFn;
        mapOrObj.set(key, computed);
      }
      return mapOrObj.get(key);
    }
    if (!mapOrObj.hasOwnProperty(key)) {
      computed = typeof callbackFn === "function" ? callbackFn(key) : callbackFn;
      mapOrObj[key] = computed;
    }
    return mapOrObj[key];
  }

  function concatIterables() {
    var out = [];
    var i;
    var j;
    var item;

    if (typeof root.Iterator === "object" && root.Iterator !== null && typeof root.Iterator.concat === "function") {
      try {
        return root.Iterator.concat.apply(root.Iterator, arguments);
      } catch (e) {}
    }

    for (i = 0; i < arguments.length; i++) {
      item = arguments[i];
      if (isArrayValue(item) || (item && typeof item.length === "number" && typeof item !== "string")) {
        for (j = 0; j < item.length; j++) {
          out.push(item[j]);
        }
      } else if (typeof item !== "undefined") {
        out.push(item);
      }
    }
    return out;
  }

  function arrayIncludes(arr, searchElement, fromIndex) {
    var len = arr ? arr.length : 0;
    var idx = typeof fromIndex === "number" ? (fromIndex < 0 ? Math.max(0, len + fromIndex) : fromIndex) : 0;
    var i;
    for (i = idx; i < len; i++) {
      if (arr[i] === searchElement || (isNaN(arr[i]) && isNaN(searchElement))) {
        return true;
      }
    }
    return false;
  }

  function arrayAt(arr, index) {
    var len = arr ? arr.length : 0;
    var idx = index < 0 ? len + index : index;
    return (idx >= 0 && idx < len) ? arr[idx] : undefined;
  }

  function arrayFlat(arr, depth) {
    var d = typeof depth === "number" ? depth : 1;
    var out = [];
    var i;
    var j;
    var sub;

    if (!isArrayValue(arr)) {
      return out;
    }
    for (i = 0; i < arr.length; i++) {
      if (isArrayValue(arr[i]) && d > 0) {
        sub = arrayFlat(arr[i], d - 1);
        for (j = 0; j < sub.length; j++) {
          out.push(sub[j]);
        }
      } else {
        out.push(arr[i]);
      }
    }
    return out;
  }

  function arrayFlatMap(arr, fn, thisArg) {
    var mapped = [];
    var i;
    for (i = 0; i < arr.length; i++) {
      mapped.push(fn.call(thisArg || null, arr[i], i, arr));
    }
    return arrayFlat(mapped, 1);
  }

  function toReversedArr(arr) {
    var copy = isArrayValue(arr) ? arr.slice(0) : [];
    return copy.reverse();
  }

  function toSortedArr(arr, compareFn) {
    var copy = isArrayValue(arr) ? arr.slice(0) : [];
    return copy.sort(compareFn);
  }

  function toSplicedArr(arr, start, deleteCount) {
    var copy = isArrayValue(arr) ? arr.slice(0) : [];
    var args = [start, deleteCount];
    var i;
    for (i = 3; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    Array.prototype.splice.apply(copy, args);
    return copy;
  }

  function withItemArr(arr, index, value) {
    var copy = isArrayValue(arr) ? arr.slice(0) : [];
    var idx = index < 0 ? copy.length + index : index;
    if (idx >= 0 && idx < copy.length) {
      copy[idx] = value;
    }
    return copy;
  }

  function findLastItem(arr, pred, thisArg) {
    var i;
    for (i = arr.length - 1; i >= 0; i--) {
      if (pred.call(thisArg || null, arr[i], i, arr)) {
        return arr[i];
      }
    }
    return undefined;
  }

  function findLastIndexItem(arr, pred, thisArg) {
    var i;
    for (i = arr.length - 1; i >= 0; i--) {
      if (pred.call(thisArg || null, arr[i], i, arr)) {
        return i;
      }
    }
    return -1;
  }

  function groupByItems(arr, keyFn) {
    var groups = {};
    var i;
    var k;
    for (i = 0; i < arr.length; i++) {
      k = String(keyFn(arr[i], i));
      if (!groups.hasOwnProperty(k)) {
        groups[k] = [];
      }
      groups[k].push(arr[i]);
    }
    return groups;
  }

  function replaceAllStr(str, search, replacement) {
    var s = String(str);
    var find = String(search);
    var rep = String(replacement);
    if (find === "") {
      return s;
    }
    if (typeof String.prototype.replaceAll === "function") {
      return s.replaceAll(find, rep);
    }
    return s.split(find).join(rep);
  }

  function isWellFormedStr(str) {
    var s = String(str);
    var i;
    var code;
    var next;
    for (i = 0; i < s.length; i++) {
      code = s.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff) {
        next = i + 1 < s.length ? s.charCodeAt(i + 1) : 0;
        if (next < 0xdc00 || next > 0xdfff) {
          return false;
        }
        i += 1;
      } else if (code >= 0xdc00 && code <= 0xdfff) {
        return false;
      }
    }
    return true;
  }

  function toWellFormedStr(str) {
    var s = String(str);
    var out = "";
    var i;
    var code;
    var next;
    for (i = 0; i < s.length; i++) {
      code = s.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff) {
        next = i + 1 < s.length ? s.charCodeAt(i + 1) : 0;
        if (next >= 0xdc00 && next <= 0xdfff) {
          out += s.charAt(i) + s.charAt(i + 1);
          i += 1;
        } else {
          out += "\ufffd";
        }
      } else if (code >= 0xdc00 && code <= 0xdfff) {
        out += "\ufffd";
      } else {
        out += s.charAt(i);
      }
    }
    return out;
  }

  function objectValues(obj) {
    var keys = getKeys(obj);
    var out = [];
    var i;
    for (i = 0; i < keys.length; i++) {
      out.push(obj[keys[i]]);
    }
    return out;
  }

  function objectEntries(obj) {
    var keys = getKeys(obj);
    var out = [];
    var i;
    for (i = 0; i < keys.length; i++) {
      out.push([keys[i], obj[keys[i]]]);
    }
    return out;
  }

  function objectFromEntries(entriesArr) {
    var out = {};
    var i;
    if (!isArrayValue(entriesArr)) {
      return out;
    }
    for (i = 0; i < entriesArr.length; i++) {
      if (entriesArr[i] && entriesArr[i].length >= 2) {
        out[String(entriesArr[i][0])] = entriesArr[i][1];
      }
    }
    return out;
  }

  function freezeSafe(obj) {
    if (typeof Object.freeze === "function" && obj && typeof obj === "object") {
      try {
        return Object.freeze(obj);
      } catch (e) {}
    }
    return obj;
  }

  function currentTimeMs() {
    if (typeof Date.now === "function") {
      return Date.now();
    }
    return new Date().getTime();
  }

  function isBinaryOrFormData(body) {
    if (!body || typeof body !== "object") {
      return false;
    }
    if (typeof root.FormData === "function" && body instanceof root.FormData) {
      return true;
    }
    if (typeof root.Blob === "function" && body instanceof root.Blob) {
      return true;
    }
    if (typeof root.ArrayBuffer === "function" && body instanceof root.ArrayBuffer) {
      return true;
    }
    if (typeof root.ArrayBuffer !== "undefined" && typeof root.ArrayBuffer.isView === "function" && root.ArrayBuffer.isView(body)) {
      return true;
    }
    return false;
  }

  function readStreamChunks(stream, onChunk, onDone) {
    var reader;
    if (!stream || typeof stream.getReader !== "function") {
      if (typeof onDone === "function") {
        onDone(null);
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

  // =========================================================================
  // HTTP REQUEST (FETCH / XHR / ACTIVEXOBJECT + RETRIES + TIMEOUT + STREAM)
  // =========================================================================

  function buildUrlWithParams(url, params) {
    var keys = getKeys(params);
    var pairs = [];
    var i;
    var k;
    var v;
    var sep;

    if (!keys.length) {
      return url;
    }
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      v = params[k];
      if (typeof v !== "undefined" && v !== null) {
        pairs.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
      }
    }
    if (!pairs.length) {
      return url;
    }
    sep = url.indexOf("?") === -1 ? "?" : "&";
    return url + sep + pairs.join("&");
  }

  function request(opts, callback) {
    var cfg = opts || {};
    var method = (cfg.method || "GET").toUpperCase();
    var fullUrl = buildUrlWithParams(cfg.url || "", cfg.params);
    var maxRetries = typeof cfg.retries === "number" && cfg.retries > 0 ? cfg.retries : 0;
    var retryDelay = typeof cfg.retryDelay === "number" && cfg.retryDelay >= 0 ? cfg.retryDelay : 250;
    var timeoutMs = typeof cfg.timeout === "number" && cfg.timeout > 0 ? cfg.timeout : 0;
    var activeAbortController = null;
    var activeXhr = null;
    var activeTimer = null;
    var abortedByUser = false;
    var d;

    function clearTimer() {
      if (activeTimer !== null && typeof root.clearTimeout === "function") {
        root.clearTimeout(activeTimer);
        activeTimer = null;
      }
    }

    d = new Deferred(function (reason) {
      abortedByUser = true;
      clearTimer();
      if (activeAbortController && typeof activeAbortController.abort === "function") {
        try { activeAbortController.abort(); } catch (e1) {}
      }
      if (activeXhr && typeof activeXhr.abort === "function") {
        try { activeXhr.abort(); } catch (e2) {}
      }
      if (typeof callback === "function") {
        var abErr = withCause(new Error(reason || "Request aborted"), cfg.cause);
        abErr.code = "ABORTED";
        callback(abErr, null);
      }
    });

    function shouldRetry(err, status) {
      if (abortedByUser) {
        return false;
      }
      if (err && err.code === "ABORTED") {
        return false;
      }
      if (err && err.timeout) {
        return true;
      }
      if (err && !status) {
        return true;
      }
      if (status === 408 || status === 429 || (status >= 500 && status <= 599)) {
        return true;
      }
      return false;
    }

    function prepareBodyAndHeaders() {
      var headers = mergeObjects({}, cfg.headers || {});
      var body = cfg.body;
      var hasContentType = false;
      var hKeys = getKeys(headers);
      var i;

      for (i = 0; i < hKeys.length; i++) {
        if (hKeys[i].toLowerCase() === "content-type") {
          hasContentType = true;
          break;
        }
      }

      if (method === "GET" || method === "HEAD") {
        return { body: undefined, headers: headers };
      }

      if (isRawJsonWrapper(body)) {
        if (!hasContentType) {
          headers["Content-Type"] = "application/json";
        }
        return { body: safeStringify(body), headers: headers };
      }

      if (body && typeof body === "object" && !isBinaryOrFormData(body)) {
        if (!hasContentType) {
          headers["Content-Type"] = "application/json";
        }
        return { body: safeStringify(body), headers: headers };
      }

      return { body: body, headers: headers };
    }

    function attempt(attemptIndex) {
      var prepared = prepareBodyAndHeaders();
      var timedOut = false;

      if (abortedByUser) {
        return;
      }

      if (timeoutMs > 0 && typeof root.setTimeout === "function") {
        activeTimer = root.setTimeout(function () {
          timedOut = true;
          if (activeAbortController && typeof activeAbortController.abort === "function") {
            try { activeAbortController.abort(); } catch (e1) {}
          }
          if (activeXhr && typeof activeXhr.abort === "function") {
            try { activeXhr.abort(); } catch (e2) {}
          }
        }, timeoutMs);
      }

      function handleFailure(rawErr, statusCode) {
        var errObj = withCause(rawErr || new Error("Network request failed"), cfg.cause);
        if (timedOut) {
          errObj.timeout = true;
        }
        if (statusCode) {
          errObj.status = statusCode;
        }
        if (attemptIndex < maxRetries && shouldRetry(errObj, statusCode)) {
          scheduleAsync(function () {
            if (typeof root.setTimeout === "function") {
              root.setTimeout(function () { attempt(attemptIndex + 1); }, retryDelay * (attemptIndex + 1));
            } else {
              attempt(attemptIndex + 1);
            }
          });
          return;
        }
        if (typeof callback === "function") {
          callback(errObj, null);
        }
        d.reject(errObj);
      }

      function handleSuccess(payload) {
        clearTimer();
        if (cfg.parseJson || cfg.responseType === "json") {
          if (typeof payload.body === "string") {
            try {
              payload.json = safeParse(payload.body, cfg.reviver);
            } catch (parseErr) {
              handleFailure(parseErr, payload.status);
              return;
            }
          } else if (payload.body && typeof payload.body === "object") {
            payload.json = payload.body;
          }
        }
        if (typeof callback === "function") {
          callback(null, payload);
        }
        d.resolve(payload);
      }

      if (typeof root.fetch === "function" && cfg.transport !== "xhr") {
        var fetchOpts = {
          method: method,
          headers: prepared.headers
        };
        if (typeof prepared.body !== "undefined") {
          fetchOpts.body = prepared.body;
        }
        if (typeof cfg.credentials === "string") {
          fetchOpts.credentials = cfg.credentials;
        }
        if (typeof root.AbortController === "function") {
          activeAbortController = new root.AbortController();
          fetchOpts.signal = activeAbortController.signal;
        }

        root.fetch(fullUrl, fetchOpts).then(
          function (res) {
            var stream = res.body || null;
            var readPromise;

            if (cfg.responseType === "arraybuffer" && typeof res.arrayBuffer === "function") {
              readPromise = res.arrayBuffer();
            } else if (cfg.responseType === "blob" && typeof res.blob === "function") {
              readPromise = res.blob();
            } else if (cfg.responseType === "json" && typeof res.text === "function") {
              readPromise = res.text();
            } else if (typeof res.text === "function") {
              readPromise = res.text();
            } else {
              readPromise = asDeferred("");
            }

            readPromise.then(
              function (bodyData) {
                clearTimer();
                var payload = {
                  status: res.status,
                  ok: res.ok,
                  body: bodyData,
                  stream: stream,
                  transport: "fetch",
                  readStream: function (onChunk, onDone) {
                    readStreamChunks(stream, onChunk, onDone);
                  }
                };
                if (!res.ok && cfg.failOnHttpError) {
                  handleFailure(new Error("HTTP " + res.status), res.status);
                  return;
                }
                handleSuccess(payload);
              },
              function (readErr) {
                handleFailure(readErr, res.status);
              }
            );
          },
          function (netErr) {
            handleFailure(netErr, 0);
          }
        );
        return;
      }

      activeXhr = createXhrInstance();
      if (!activeXhr) {
        handleFailure(new Error("No HTTP transport (fetch/XHR/ActiveXObject) available"), 0);
        return;
      }

      try {
        activeXhr.open(method, fullUrl, true);
      } catch (openErr) {
        handleFailure(openErr, 0);
        return;
      }

      if (typeof cfg.withCredentials === "boolean") {
        try { activeXhr.withCredentials = cfg.withCredentials; } catch (wcErr) {}
      }

      var hKeys = getKeys(prepared.headers);
      var i;
      for (i = 0; i < hKeys.length; i++) {
        try {
          activeXhr.setRequestHeader(hKeys[i], String(prepared.headers[hKeys[i]]));
        } catch (hdrErr) {}
      }

      activeXhr.onreadystatechange = function () {
        var st;
        var respText;
        var payload;

        if (activeXhr.readyState !== 4) {
          return;
        }
        clearTimer();

        if (abortedByUser) {
          return;
        }

        st = activeXhr.status || 0;
        if (timedOut) {
          handleFailure(new Error("Request timed out after " + timeoutMs + "ms"), st);
          return;
        }
        if (st === 0 && !activeXhr.responseText) {
          handleFailure(new Error("XHR transport error"), 0);
          return;
        }

        respText = activeXhr.responseText;
        payload = {
          status: st,
          ok: st >= 200 && st < 300,
          body: respText,
          stream: null,
          transport: "xhr",
          readStream: function (onChunk, onDone) {
            if (typeof onChunk === "function" && typeof respText !== "undefined") {
              onChunk(respText);
            }
            if (typeof onDone === "function") {
              onDone(null);
            }
          }
        };

        if (!payload.ok && cfg.failOnHttpError) {
          handleFailure(new Error("HTTP " + st), st);
          return;
        }
        handleSuccess(payload);
      };

      try {
        activeXhr.send(typeof prepared.body === "undefined" ? null : prepared.body);
      } catch (sendErr) {
        handleFailure(sendErr, 0);
      }
    }

    attempt(0);
    return d;
  }

  // =========================================================================
  // WEBSOCKET CLIENT
  // =========================================================================

  function connectSocket(url, protocols, sockOpts) {
    var d = new Deferred();
    var opts = sockOpts || {};
    var pingTimer = null;
    var socket;

    if (typeof root.WebSocket !== "function") {
      d.reject(new Error("WebSocket is not supported in this runtime."));
      return d;
    }

    function stopPing() {
      if (pingTimer !== null && typeof root.clearInterval === "function") {
        root.clearInterval(pingTimer);
        pingTimer = null;
      }
    }

    try {
      socket = protocols ? new root.WebSocket(url, protocols) : new root.WebSocket(url);
    } catch (err) {
      d.reject(err);
      return d;
    }

    if (typeof opts.binaryType === "string") {
      try { socket.binaryType = opts.binaryType; } catch (btErr) {}
    }

    socket.onopen = function (ev) {
      if (typeof opts.pingInterval === "number" && opts.pingInterval > 0 && typeof root.setInterval === "function") {
        var payload = typeof opts.pingPayload !== "undefined" ? opts.pingPayload : '{"type":"ping"}';
        pingTimer = root.setInterval(function () {
          if (socket.readyState === 1) {
            try { socket.send(payload); } catch (pErr) {}
          }
        }, opts.pingInterval);
      }
      d.resolve({
        socket: socket,
        event: ev,
        stopPing: stopPing
      });
    };

    socket.onerror = function (errEv) {
      stopPing();
      d.reject(errEv || new Error("WebSocket error"));
    };

    socket.onclose = function () {
      stopPing();
    };

    return d;
  }

  // =========================================================================
  // FROM-SCRATCH ES3 STUN / TURN PARSER, SDP CODEC & WEBRTC ENGINE
  // =========================================================================

  function parseIceUrl(rawUrl) {
    var str = String(rawUrl || "");
    var colonIdx = str.indexOf(":");
    var scheme;
    var rest;
    var qIdx;
    var queryPart = "";
    var hostPort;
    var host;
    var port;
    var defaultPort;
    var transport = "udp";
    var qPairs;
    var i;
    var kv;

    if (colonIdx <= 0) {
      return null;
    }

    scheme = str.slice(0, colonIdx).toLowerCase();
    if (scheme !== "stun" && scheme !== "stuns" && scheme !== "turn" && scheme !== "turns") {
      return null;
    }

    rest = str.slice(colonIdx + 1);
    if (rest.slice(0, 2) === "//") {
      rest = rest.slice(2);
    }

    qIdx = rest.indexOf("?");
    if (qIdx !== -1) {
      queryPart = rest.slice(qIdx + 1);
      hostPort = rest.slice(0, qIdx);
    } else {
      hostPort = rest;
    }

    if (queryPart) {
      qPairs = queryPart.split("&");
      for (i = 0; i < qPairs.length; i++) {
        kv = qPairs[i].split("=");
        if (kv[0] && kv[0].toLowerCase() === "transport" && kv[1]) {
          transport = kv[1].toLowerCase();
        }
      }
    }

    defaultPort = (scheme === "stuns" || scheme === "turns") ? 5349 : 3478;

    if (hostPort.charAt(0) === "[") {
      var closeBracket = hostPort.indexOf("]");
      if (closeBracket === -1) {
        return null;
      }
      host = hostPort.slice(1, closeBracket);
      if (hostPort.charAt(closeBracket + 1) === ":") {
        port = parseInt(hostPort.slice(closeBracket + 2), 10);
      } else {
        port = defaultPort;
      }
    } else {
      var lastColon = hostPort.lastIndexOf(":");
      if (lastColon !== -1 && hostPort.indexOf(":") === lastColon) {
        host = hostPort.slice(0, lastColon);
        port = parseInt(hostPort.slice(lastColon + 1), 10);
      } else {
        host = hostPort;
        port = defaultPort;
      }
    }

    if (!host || isNaN(port) || port <= 0 || port > 65535) {
      return null;
    }

    return {
      raw: str,
      scheme: scheme,
      isTurn: scheme === "turn" || scheme === "turns",
      isTls: scheme === "stuns" || scheme === "turns",
      host: host,
      port: port,
      transport: transport
    };
  }

  function normalizeIceServers(input) {
    var list = isArrayValue(input) ? input : (input ? [input] : []);
    var normalized = [];
    var stunServers = [];
    var turnServers = [];
    var i;
    var u;
    var entry;
    var urlsArr;
    var parsedUrls;
    var j;
    var parsed;

    for (i = 0; i < list.length; i++) {
      entry = list[i];
      if (!entry) {
        continue;
      }

      if (typeof entry === "string") {
        urlsArr = [entry];
        parsedUrls = [];
        parsed = parseIceUrl(entry);
        if (parsed) {
          parsedUrls.push(parsed);
          if (parsed.isTurn) {
            turnServers.push(parsed);
          } else {
            stunServers.push(parsed);
          }
        }
        normalized.push({
          urls: urlsArr,
          parsedUrls: parsedUrls
        });
      } else if (typeof entry === "object" && entry.urls) {
        urlsArr = isArrayValue(entry.urls) ? entry.urls.slice(0) : [entry.urls];
        parsedUrls = [];
        for (j = 0; j < urlsArr.length; j++) {
          parsed = parseIceUrl(urlsArr[j]);
          if (parsed) {
            parsedUrls.push(parsed);
            if (parsed.isTurn) {
              turnServers.push(mergeObjects(parsed, {
                username: entry.username || "",
                hasCredential: typeof entry.credential !== "undefined" && entry.credential !== null
              }));
            } else {
              stunServers.push(parsed);
            }
          }
        }

        u = {
          urls: urlsArr.length === 1 ? urlsArr[0] : urlsArr,
          parsedUrls: parsedUrls
        };
        if (typeof entry.username === "string") {
          u.username = entry.username;
        }
        if (typeof entry.credential !== "undefined") {
          u.credential = entry.credential;
        }
        if (typeof entry.credentialType === "string") {
          u.credentialType = entry.credentialType;
        }
        normalized.push(u);
      }
    }

    return {
      iceServers: normalized,
      stunServers: stunServers,
      turnServers: turnServers
    };
  }

  function buildSdp(opts) {
    var cfg = opts || {};
    var role = cfg.role === "answer" ? "answer" : "offer";
    var sessionId = cfg.sessionId || String(Math.floor(Math.random() * 900000000) + 100000000);
    var sessionVersion = typeof cfg.version === "number" ? cfg.version : 2;
    var ufrag = cfg.iceUfrag || randomHexToken(4);
    var pwd = cfg.icePwd || randomHexToken(16);
    var fingerprint = cfg.fingerprint || (
      "sha-256 " +
      randomHexToken(4).match(/.{1,2}/g).join(":") + ":" +
      randomHexToken(4).match(/.{1,2}/g).join(":") + ":" +
      randomHexToken(4).match(/.{1,2}/g).join(":") + ":" +
      randomHexToken(4).match(/.{1,2}/g).join(":")
    );
    var setup = cfg.setup || (role === "offer" ? "actpass" : "active");
    var mid = cfg.mid || "0";
    var sctpPort = typeof cfg.sctpPort === "number" ? cfg.sctpPort : 5000;
    var maxMessageSize = typeof cfg.maxMessageSize === "number" ? cfg.maxMessageSize : 262144;
    var candidates = isArrayValue(cfg.candidates) ? cfg.candidates : [];
    var lines = [];
    var i;
    var cLine;

    lines.push("v=0");
    lines.push("o=LegacyNet " + sessionId + " " + sessionVersion + " IN IP4 0.0.0.0");
    lines.push("s=LegacyNet-ES3-Session");
    lines.push("t=0 0");
    lines.push("a=group:BUNDLE " + mid);
    lines.push("a=msid-semantic: WMS");
    lines.push("m=application 9 UDP/DTLS/SCTP webrtc-datachannel");
    lines.push("c=IN IP4 0.0.0.0");
    lines.push("a=ice-ufrag:" + ufrag);
    lines.push("a=ice-pwd:" + pwd);
    lines.push("a=ice-options:trickle");
    lines.push("a=fingerprint:" + fingerprint);
    lines.push("a=setup:" + setup);
    lines.push("a=mid:" + mid);
    lines.push("a=sctp-port:" + sctpPort);
    lines.push("a=max-message-size:" + maxMessageSize);

    for (i = 0; i < candidates.length; i++) {
      cLine = typeof candidates[i] === "string"
        ? candidates[i]
        : (candidates[i] && candidates[i].candidate ? candidates[i].candidate : "");
      if (cLine) {
        if (cLine.indexOf("a=candidate:") === 0) {
          lines.push(cLine);
        } else {
          lines.push("a=candidate:" + cLine);
        }
      }
    }

    return lines.join("\r\n") + "\r\n";
  }

  function parseSdp(sdpText) {
    var raw = String(sdpText || "");
    var lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    var parsed = {
      version: null,
      origin: null,
      sessionName: "",
      iceUfrag: "",
      icePwd: "",
      fingerprint: "",
      setup: "",
      mid: "",
      sctpPort: null,
      mediaSections: [],
      candidates: []
    };
    var currentMedia = null;
    var i;
    var line;
    var type;
    var val;

    for (i = 0; i < lines.length; i++) {
      line = lines[i];
      if (!line || line.length < 2 || line.charAt(1) !== "=") {
        continue;
      }
      type = line.charAt(0);
      val = line.slice(2);

      if (type === "v") {
        parsed.version = parseInt(val, 10);
      } else if (type === "o") {
        parsed.origin = val;
      } else if (type === "s") {
        parsed.sessionName = val;
      } else if (type === "m") {
        currentMedia = {
          mLine: val,
          protocol: val.split(" ")[2] || "",
          attributes: []
        };
        parsed.mediaSections.push(currentMedia);
      } else if (type === "a") {
        if (currentMedia) {
          currentMedia.attributes.push(val);
        }
        if (val.indexOf("ice-ufrag:") === 0) {
          parsed.iceUfrag = val.slice("ice-ufrag:".length);
        } else if (val.indexOf("ice-pwd:") === 0) {
          parsed.icePwd = val.slice("ice-pwd:".length);
        } else if (val.indexOf("fingerprint:") === 0) {
          parsed.fingerprint = val.slice("fingerprint:".length);
        } else if (val.indexOf("setup:") === 0) {
          parsed.setup = val.slice("setup:".length);
        } else if (val.indexOf("mid:") === 0) {
          parsed.mid = val.slice("mid:".length);
        } else if (val.indexOf("sctp-port:") === 0) {
          parsed.sctpPort = parseInt(val.slice("sctp-port:".length), 10);
        } else if (val.indexOf("candidate:") === 0) {
          parsed.candidates.push(val.slice("candidate:".length));
        }
      }
    }

    return parsed;
  }

  function normalizeCandidatePayload(candInput) {
    if (!candInput) {
      return null;
    }
    if (typeof candInput === "string") {
      return {
        candidate: candInput.indexOf("candidate:") === 0 ? candInput : "candidate:" + candInput,
        sdpMid: "0",
        sdpMLineIndex: 0
      };
    }
    if (typeof candInput === "object" && candInput.candidate) {
      var out = {
        candidate: String(candInput.candidate),
        sdpMid: typeof candInput.sdpMid === "string" ? candInput.sdpMid : "0",
        sdpMLineIndex: typeof candInput.sdpMLineIndex === "number" ? candInput.sdpMLineIndex : 0
      };
      if (typeof candInput.usernameFragment === "string") {
        out.usernameFragment = candInput.usernameFragment;
      }
      return out;
    }
    return null;
  }

  function createRtcEngine(opts) {
    var cfg = opts || {};
    var iceBundle = normalizeIceServers(cfg.iceServers || []);
    var sendSignal = cfg.sendSignal;
    var PeerCtor = getNativePeerConnectionCtor();
    var DescCtor = getNativeSessionDescriptionCtor();
    var CandCtor = getNativeIceCandidateCtor();
    var pc = null;
    var remoteDescriptionSet = false;
    var pendingRemoteCandidates = [];
    var localCandidates = [];
    var channels = {};
    var connectionState = "new";
    var iceGatheringState = "new";
    var handlers = {
      stateChange: [],
      iceGatheringStateChange: [],
      iceCandidate: [],
      signal: [],
      dataChannel: [],
      message: [],
      track: [],
      error: [],
      close: []
    };

    function on(eventName, fn) {
      if (handlers[eventName] && typeof fn === "function") {
        handlers[eventName].push(fn);
      }
    }

    function off(eventName, fn) {
      var list = handlers[eventName];
      var next = [];
      var i;
      if (!list) {
        return;
      }
      for (i = 0; i < list.length; i++) {
        if (list[i] !== fn) {
          next.push(list[i]);
        }
      }
      handlers[eventName] = next;
    }

    function emit(eventName, payload) {
      var list = handlers[eventName] || [];
      var i;
      for (i = 0; i < list.length; i++) {
        try {
          list[i](payload);
        } catch (e) {}
      }
    }

    function setConnectionState(nextState) {
      if (connectionState !== nextState) {
        connectionState = nextState;
        emit("stateChange", nextState);
      }
    }

    function setIceGatheringState(nextState) {
      if (iceGatheringState !== nextState) {
        iceGatheringState = nextState;
        emit("iceGatheringStateChange", nextState);
      }
    }

    function attachDataChannel(ch) {
      var label = ch && ch.label ? ch.label : ("ch_" + randomHexToken(3));
      var api = {
        label: label,
        channel: ch,
        readyState: ch ? ch.readyState : "connecting",
        send: function (data) {
          if (!ch || ch.readyState !== "open") {
            throw new Error("DataChannel '" + label + "' is not open.");
          }
          return ch.send(data);
        },
        close: function () {
          if (ch && typeof ch.close === "function") {
            try { ch.close(); } catch (e) {}
          }
        }
      };

      channels[label] = api;

      if (ch) {
        ch.onopen = function () {
          api.readyState = "open";
          emit("dataChannel", api);
        };
        ch.onclose = function () {
          api.readyState = "closed";
        };
        ch.onerror = function (err) {
          api.readyState = "closed";
          emit("error", { source: "datachannel", label: label, error: err });
        };
        ch.onmessage = function (ev) {
          emit("message", {
            label: label,
            data: ev ? ev.data : undefined,
            event: ev
          });
        };
      }

      return api;
    }

    function flushQueuedCandidates() {
      var i;
      var item;
      var candObj;

      if (!remoteDescriptionSet || !pc) {
        return;
      }

      for (i = 0; i < pendingRemoteCandidates.length; i++) {
        item = pendingRemoteCandidates[i];
        candObj = CandCtor ? new CandCtor(item) : item;
        try {
          pc.addIceCandidate(candObj);
        } catch (err) {
          emit("error", { source: "addIceCandidate", error: err, candidate: item });
        }
      }
      pendingRemoteCandidates = [];
    }

    if (PeerCtor) {
      pc = new PeerCtor(
        mergeObjects(
          { iceServers: iceBundle.iceServers },
          cfg.rtcConfig || {}
        )
      );

      pc.onicecandidate = function (ev) {
        var norm;
        var msg;

        if (ev && ev.candidate) {
          norm = normalizeCandidatePayload({
            candidate: ev.candidate.candidate,
            sdpMid: ev.candidate.sdpMid,
            sdpMLineIndex: ev.candidate.sdpMLineIndex,
            usernameFragment: ev.candidate.usernameFragment
          });
          if (norm) {
            localCandidates.push(norm);
            msg = { type: "candidate", candidate: norm };
            emit("iceCandidate", norm);
            emit("signal", msg);
            if (typeof sendSignal === "function") {
              sendSignal(msg);
            }
          }
        } else {
          setIceGatheringState("complete");
          if (cfg.emitEndOfCandidates === true) {
            var endMsg = { type: "end-of-candidates" };
            emit("signal", endMsg);
            if (typeof sendSignal === "function") {
              sendSignal(endMsg);
            }
          }
        }
      };

      pc.onicegatheringstatechange = function () {
        if (pc.iceGatheringState) {
          setIceGatheringState(pc.iceGatheringState);
        }
      };

      pc.onconnectionstatechange = function () {
        if (pc.connectionState) {
          setConnectionState(pc.connectionState);
        }
      };

      pc.oniceconnectionstatechange = function () {
        if (!pc.connectionState && pc.iceConnectionState) {
          if (pc.iceConnectionState === "completed" || pc.iceConnectionState === "connected") {
            setConnectionState("connected");
          } else if (pc.iceConnectionState === "failed") {
            setConnectionState("failed");
          } else if (pc.iceConnectionState === "disconnected") {
            setConnectionState("disconnected");
          } else if (pc.iceConnectionState === "checking") {
            setConnectionState("connecting");
          }
        }
      };

      pc.ondatachannel = function (ev) {
        if (ev && ev.channel) {
          attachDataChannel(ev.channel);
        }
      };

      pc.ontrack = function (ev) {
        emit("track", ev);
      };
    }

    function createDataChannel(label, channelOpts) {
      var ch;
      if (!pc || typeof pc.createDataChannel !== "function") {
        throw new Error("Host RTCPeerConnection is unavailable for creating DataChannel.");
      }
      ch = pc.createDataChannel(label || "data", channelOpts || {});
      return attachDataChannel(ch);
    }

    function applyLocalDescription(desc, type, d) {
      var sdpStr = typeof desc === "string" ? desc : (desc && desc.sdp ? desc.sdp : "");
      var descObj = DescCtor ? new DescCtor({ type: type, sdp: sdpStr }) : { type: type, sdp: sdpStr };
      var msg = {
        type: type,
        sdp: { type: type, sdp: sdpStr },
        parsed: parseSdp(sdpStr)
      };

      setIceGatheringState("gathering");
      emit("signal", msg);
      if (typeof sendSignal === "function") {
        sendSignal(msg);
      }
      d.resolve(descObj);
    }

    function createOffer(offerOpts) {
      var d = new Deferred();
      var promiseOrUndefined;

      if (!pc) {
        d.reject(new Error("Host RTCPeerConnection is not supported in this runtime."));
        return d;
      }

      try {
        promiseOrUndefined = pc.createOffer(offerOpts || {});
      } catch (err) {
        d.reject(err);
        return d;
      }

      if (promiseOrUndefined && typeof promiseOrUndefined.then === "function") {
        promiseOrUndefined.then(
          function (desc) {
            var setLocal = pc.setLocalDescription(desc);
            if (setLocal && typeof setLocal.then === "function") {
              setLocal.then(
                function () { applyLocalDescription(desc, "offer", d); },
                function (err) { d.reject(err); }
              );
            } else {
              applyLocalDescription(desc, "offer", d);
            }
          },
          function (err) { d.reject(err); }
        );
      } else {
        pc.createOffer(
          function (desc) {
            pc.setLocalDescription(
              desc,
              function () { applyLocalDescription(desc, "offer", d); },
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
      var promiseOrUndefined;

      if (!pc) {
        d.reject(new Error("Host RTCPeerConnection is not supported in this runtime."));
        return d;
      }

      try {
        promiseOrUndefined = pc.createAnswer(answerOpts || {});
      } catch (err) {
        d.reject(err);
        return d;
      }

      if (promiseOrUndefined && typeof promiseOrUndefined.then === "function") {
        promiseOrUndefined.then(
          function (desc) {
            var setLocal = pc.setLocalDescription(desc);
            if (setLocal && typeof setLocal.then === "function") {
              setLocal.then(
                function () { applyLocalDescription(desc, "answer", d); },
                function (err) { d.reject(err); }
              );
            } else {
              applyLocalDescription(desc, "answer", d);
            }
          },
          function (err) { d.reject(err); }
        );
      } else {
        pc.createAnswer(
          function (desc) {
            pc.setLocalDescription(
              desc,
              function () { applyLocalDescription(desc, "answer", d); },
              function (err) { d.reject(err); }
            );
          },
          function (err) { d.reject(err); },
          answerOpts || {}
        );
      }

      return d;
    }

    function handleRemoteDescription(rawDesc, type, d) {
      var sdpStr = typeof rawDesc === "string" ? rawDesc : (rawDesc && rawDesc.sdp ? rawDesc.sdp : "");
      var descObj = DescCtor ? new DescCtor({ type: type, sdp: sdpStr }) : { type: type, sdp: sdpStr };
      var setRem;

      if (!pc || typeof pc.setRemoteDescription !== "function") {
        d.reject(new Error("Host RTCPeerConnection cannot apply remote description."));
        return;
      }

      function onRemoteApplied() {
        remoteDescriptionSet = true;
        flushQueuedCandidates();
        if (type === "offer" && cfg.autoAnswer !== false) {
          createAnswer().then(
            function (ans) { d.resolve(ans); },
            function (err) { d.reject(err); }
          );
        } else {
          d.resolve(descObj);
        }
      }

      try {
        setRem = pc.setRemoteDescription(descObj);
      } catch (err) {
        d.reject(err);
        return;
      }

      if (setRem && typeof setRem.then === "function") {
        setRem.then(onRemoteApplied, function (err) { d.reject(err); });
      } else {
        pc.setRemoteDescription(descObj, onRemoteApplied, function (err) { d.reject(err); });
      }
    }

    function addRemoteCandidate(rawCandidate) {
      var d = new Deferred();
      var norm = normalizeCandidatePayload(rawCandidate);
      var candObj;
      var addRes;

      if (!norm) {
        d.reject(new Error("Invalid ICE candidate payload."));
        return d;
      }

      if (!remoteDescriptionSet) {
        pendingRemoteCandidates.push(norm);
        d.resolve(norm);
        return d;
      }

      if (!pc || typeof pc.addIceCandidate !== "function") {
        d.reject(new Error("Host RTCPeerConnection cannot add ICE candidate."));
        return d;
      }

      candObj = CandCtor ? new CandCtor(norm) : norm;
      try {
        addRes = pc.addIceCandidate(candObj);
      } catch (err) {
        d.reject(err);
        return d;
      }

      if (addRes && typeof addRes.then === "function") {
        addRes.then(
          function () { d.resolve(norm); },
          function (err) { d.reject(err); }
        );
      } else {
        d.resolve(norm);
      }

      return d;
    }

    function handleSignal(signalMsg) {
      var msg = signalMsg;
      if (typeof msg === "string") {
        try {
          msg = safeParse(msg);
        } catch (err) {
          var bad = new Deferred();
          bad.reject(err);
          return bad;
        }
      }

      if (!msg || !msg.type) {
        var invalid = new Deferred();
        invalid.reject(new Error("Signal message requires a 'type' property."));
        return invalid;
      }

      if (msg.type === "offer" || msg.type === "answer") {
        var dDesc = new Deferred();
        handleRemoteDescription(msg.sdp || msg.description, msg.type, dDesc);
        return dDesc;
      }

      if (msg.type === "candidate" && msg.candidate) {
        return addRemoteCandidate(msg.candidate);
      }

      if (msg.type === "end-of-candidates") {
        setIceGatheringState("complete");
        var dEnd = new Deferred();
        dEnd.resolve(true);
        return dEnd;
      }

      var unknown = new Deferred();
      unknown.reject(new Error("Unsupported signal type: " + msg.type));
      return unknown;
    }

    function close() {
      var names = getKeys(channels);
      var i;
      for (i = 0; i < names.length; i++) {
        channels[names[i]].close();
      }
      if (pc && typeof pc.close === "function") {
        try { pc.close(); } catch (e) {}
      }
      setConnectionState("closed");
      emit("close", { connectionState: connectionState });
    }

    return {
      hasNativeWebRtc: pc !== null,
      peerConnection: pc,
      iceServers: iceBundle.iceServers,
      stunServers: iceBundle.stunServers,
      turnServers: iceBundle.turnServers,
      localCandidates: localCandidates,
      channels: channels,
      getState: function () {
        return {
          connectionState: connectionState,
          iceGatheringState: iceGatheringState,
          remoteDescriptionSet: remoteDescriptionSet,
          queuedCandidates: pendingRemoteCandidates.length
        };
      },
      createDataChannel: createDataChannel,
      createOffer: createOffer,
      createAnswer: createAnswer,
      addRemoteCandidate: addRemoteCandidate,
      handleSignal: handleSignal,
      on: on,
      off: off,
      close: close
    };
  }

  // =========================================================================
  // PUBLIC LIBRARY SURFACE
  // =========================================================================

  var LegacyNet = {
    version: "1.8.0-multi",
    capabilities: capabilities,
    limits: freezeSafe({
      missingProtocols: [
        "Raw UDP / TCP sockets in plain ES3 without host bindings",
        "ICE / STUN / TURN packet transport and DTLS / SRTP crypto without host WebRTC"
      ],
      securityEnforcedByHost: [
        "Same-Origin Policy (SOP)",
        "Cross-Origin Resource Sharing (CORS)",
        "TLS / HTTPS certificate validation"
      ]
    }),
    deferred: createDeferred,
    all: allDeferred,
    race: raceDeferred,
    any: anyDeferred,
    allSettled: allSettledDeferred,
    withResolvers: withResolvers,
    tryCall: tryCall,
    fromAsync: fromAsync,
    json: {
      stringify: safeStringify,
      parse: safeParse,
      rawJSON: rawJson,
      isRawJSON: isRawJsonWrapper
    },
    utils: {
      globalObj: root,
      isArray: isArrayValue,
      isError: isErrorValue,
      merge: mergeObjects,
      keys: getKeys,
      values: objectValues,
      entries: objectEntries,
      fromEntries: objectFromEntries,
      freezeSafe: freezeSafe,
      now: currentTimeMs,
      mapGetOrInsert: mapGetOrInsert,
      mapGetOrInsertComputed: mapGetOrInsertComputed,
      includes: arrayIncludes,
      flat: arrayFlat,
      flatMap: arrayFlatMap,
      at: arrayAt,
      toReversed: toReversedArr,
      toSorted: toSortedArr,
      toSpliced: toSplicedArr,
      withItem: withItemArr,
      findLast: findLastItem,
      findLastIndex: findLastIndexItem,
      groupBy: groupByItems,
      concatIterables: concatIterables,
      replaceAll: replaceAllStr,
      isWellFormed: isWellFormedStr,
      toWellFormed: toWellFormedStr,
      withCause: withCause,
      sumPrecise: sumPrecise,
      toHex: toHexBytes,
      fromHex: fromHexBytes,
      toBase64: toBase64Bytes,
      fromBase64: fromBase64Bytes,
      isBinaryOrFormData: isBinaryOrFormData,
      readStreamChunks: readStreamChunks
    },
    request: request,
    connectSocket: connectSocket,
    rtc: {
      hasNativeWebRtc: getNativePeerConnectionCtor() !== null,
      normalizeIceServers: normalizeIceServers,
      parseIceUrl: parseIceUrl,
      createStunTransactionId: createStunTransactionId,
      buildSdp: buildSdp,
      parseSdp: parseSdp,
      normalizeCandidate: normalizeCandidatePayload,
      createEngine: createRtcEngine
    }
  };

  root.LegacyNet = LegacyNet;
})(typeof window !== "undefined" ? window : this);
