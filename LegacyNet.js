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

  function isErrorValue(val) {
    if (typeof root.Error !== "undefined" && typeof root.Error.isError === "function") {
      return root.Error.isError(val);
    }
    return val instanceof Error;
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

  function getValues(obj) {
    var keys;
    var out = [];
    var i;
    if (!obj || typeof obj !== "object") {
      return out;
    }
    if (typeof Object.values === "function") {
      return Object.values(obj);
    }
    keys = getKeys(obj);
    for (i = 0; i < keys.length; i++) {
      out.push(obj[keys[i]]);
    }
    return out;
  }

  function getEntries(obj) {
    var keys;
    var out = [];
    var i;
    if (!obj || typeof obj !== "object") {
      return out;
    }
    if (typeof Object.entries === "function") {
      return Object.entries(obj);
    }
    keys = getKeys(obj);
    for (i = 0; i < keys.length; i++) {
      out.push([keys[i], obj[keys[i]]]);
    }
    return out;
  }

  function fromEntriesSafe(entries) {
    var out = {};
    var i;
    var pair;
    if (!entries) {
      return out;
    }
    if (typeof Object.fromEntries === "function") {
      try {
        return Object.fromEntries(entries);
      } catch (e) {}
    }
    if (isArrayValue(entries)) {
      for (i = 0; i < entries.length; i++) {
        pair = entries[i];
        if (pair && pair.length >= 2) {
          out[String(pair[0])] = pair[1];
        }
      }
    }
    return out;
  }

  function freezeSafe(obj) {
    if (obj && typeof obj === "object" && typeof Object.freeze === "function") {
      try {
        return Object.freeze(obj);
      } catch (e) {}
    }
    return obj;
  }

  function nowMs() {
    if (typeof Date !== "undefined" && typeof Date.now === "function") {
      return Date.now();
    }
    return new Date().getTime();
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

  function includesValue(arr, searchElement, fromIndex) {
    var len;
    var k;
    var v;
    if (!isArrayValue(arr)) {
      return false;
    }
    if (typeof arr.includes === "function") {
      return arr.includes(searchElement, fromIndex);
    }
    len = arr.length;
    if (len === 0) {
      return false;
    }
    k = typeof fromIndex === "number" ? fromIndex : 0;
    if (k < 0) {
      k = Math.max(len + k, 0);
    }
    while (k < len) {
      v = arr[k];
      if (v === searchElement || (v !== v && searchElement !== searchElement)) {
        return true;
      }
      k++;
    }
    return false;
  }

  function flatArray(arr, depth) {
    var d = typeof depth === "number" ? depth : 1;
    var out = [];
    var i;
    var item;
    if (!isArrayValue(arr)) {
      return out;
    }
    if (d >= 1 && typeof arr.flat === "function") {
      return arr.flat(d);
    }
    for (i = 0; i < arr.length; i++) {
      item = arr[i];
      if (isArrayValue(item) && d > 0) {
        out = out.concat(flatArray(item, d - 1));
      } else {
        out.push(item);
      }
    }
    return out;
  }

  function flatMapArray(arr, fn, thisArg) {
    var mapped = [];
    var i;
    if (!isArrayValue(arr)) {
      return mapped;
    }
    if (typeof arr.flatMap === "function") {
      return arr.flatMap(fn, thisArg);
    }
    for (i = 0; i < arr.length; i++) {
      mapped.push(fn.call(thisArg, arr[i], i, arr));
    }
    return flatArray(mapped, 1);
  }

  function replaceAllString(str, searchVal, replaceVal) {
    var s = String(str);
    var search = String(searchVal);
    var rep = String(replaceVal);
    var idx;
    var nextIdx;
    var out = "";

    if (typeof s.replaceAll === "function") {
      return s.replaceAll(searchVal, replaceVal);
    }
    if (search.length === 0) {
      return s;
    }
    idx = 0;
    while ((nextIdx = s.indexOf(search, idx)) !== -1) {
      out += s.slice(idx, nextIdx) + rep;
      idx = nextIdx + search.length;
    }
    out += s.slice(idx);
    return out;
  }

  function atIndex(list, index) {
    var idx = typeof index === "number" ? (Math.trunc ? Math.trunc(index) : (index < 0 ? Math.ceil(index) : Math.floor(index))) : 0;
    if (!list || typeof list.length !== "number") {
      return undefined;
    }
    if (typeof list.at === "function") {
      return list.at(idx);
    }
    if (idx < 0) {
      idx = list.length + idx;
    }
    if (idx < 0 || idx >= list.length) {
      return undefined;
    }
    return list[idx];
  }

  function withCause(err, cause) {
    var target = isErrorValue(err) ? err : new Error(String(err || "Error"));
    if (cause !== undefined) {
      target.cause = cause;
    }
    return target;
  }

  function toReversedArray(arr) {
    if (!isArrayValue(arr)) {
      return [];
    }
    if (typeof arr.toReversed === "function") {
      return arr.toReversed();
    }
    return arr.slice(0).reverse();
  }

  function toSortedArray(arr, compareFn) {
    if (!isArrayValue(arr)) {
      return [];
    }
    if (typeof arr.toSorted === "function") {
      return arr.toSorted(compareFn);
    }
    return arr.slice(0).sort(compareFn);
  }

  function toSplicedArray(arr, start, deleteCount) {
    var copy;
    var i;
    var extraArgs = [];
    if (!isArrayValue(arr)) {
      return [];
    }
    if (typeof arr.toSpliced === "function") {
      return arr.toSpliced.apply(arr, Array.prototype.slice.call(arguments, 1));
    }
    copy = arr.slice(0);
    for (i = 3; i < arguments.length; i++) {
      extraArgs.push(arguments[i]);
    }
    Array.prototype.splice.apply(copy, [start, deleteCount].concat(extraArgs));
    return copy;
  }

  function withArrayItem(arr, index, value) {
    var copy;
    var idx = index;
    if (!isArrayValue(arr)) {
      return [];
    }
    if (typeof arr["with"] === "function") {
      return arr["with"](idx, value);
    }
    if (idx < 0) {
      idx = arr.length + idx;
    }
    if (idx < 0 || idx >= arr.length) {
      throw new RangeError("Invalid index");
    }
    copy = arr.slice(0);
    copy[idx] = value;
    return copy;
  }

  function findLastItem(arr, predicate, thisArg) {
    var i;
    if (!isArrayValue(arr) || typeof predicate !== "function") {
      return undefined;
    }
    if (typeof arr.findLast === "function") {
      return arr.findLast(predicate, thisArg);
    }
    for (i = arr.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, arr[i], i, arr)) {
        return arr[i];
      }
    }
    return undefined;
  }

  function findLastIndexItem(arr, predicate, thisArg) {
    var i;
    if (!isArrayValue(arr) || typeof predicate !== "function") {
      return -1;
    }
    if (typeof arr.findLastIndex === "function") {
      return arr.findLastIndex(predicate, thisArg);
    }
    for (i = arr.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, arr[i], i, arr)) {
        return i;
      }
    }
    return -1;
  }

  function groupByKey(items, keyFn) {
    var groups = {};
    var i;
    var k;
    if (!isArrayValue(items) || typeof keyFn !== "function") {
      return groups;
    }
    if (typeof Object.groupBy === "function") {
      return Object.groupBy(items, keyFn);
    }
    for (i = 0; i < items.length; i++) {
      k = String(keyFn(items[i], i));
      if (!groups[k]) {
        groups[k] = [];
      }
      groups[k].push(items[i]);
    }
    return groups;
  }

  function isWellFormedStr(str) {
    var s = String(str);
    var i;
    var code;
    var nextCode;
    if (typeof s.isWellFormed === "function") {
      return s.isWellFormed();
    }
    for (i = 0; i < s.length; i++) {
      code = s.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF) {
        nextCode = i + 1 < s.length ? s.charCodeAt(i + 1) : 0;
        if (!(nextCode >= 0xDC00 && nextCode <= 0xDFFF)) {
          return false;
        }
        i++;
      } else if (code >= 0xDC00 && code <= 0xDFFF) {
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
    var nextCode;
    if (typeof s.toWellFormed === "function") {
      return s.toWellFormed();
    }
    for (i = 0; i < s.length; i++) {
      code = s.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF) {
        nextCode = i + 1 < s.length ? s.charCodeAt(i + 1) : 0;
        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
          out += s.charAt(i) + s.charAt(i + 1);
          i++;
        } else {
          out += "\uFFFD";
        }
      } else if (code >= 0xDC00 && code <= 0xDFFF) {
        out += "\uFFFD";
      } else {
        out += s.charAt(i);
      }
    }
    return out;
  }

  function sumPreciseNumbers(values) {
    var list = [];
    var sum = 0;
    var comp = 0;
    var seenAny = false;
    var allNegZero = true;
    var i;
    var n;
    var y;
    var t;

    if (typeof Math !== "undefined" && typeof Math.sumPrecise === "function") {
      try {
        return Math.sumPrecise(values);
      } catch (e) {}
    }

    if (isArrayValue(values)) {
      list = values;
    } else if (values && typeof values.length === "number") {
      for (i = 0; i < values.length; i++) {
        list.push(values[i]);
      }
    }

    for (i = 0; i < list.length; i++) {
      n = list[i];
      if (typeof n !== "number") {
        throw new TypeError("sumPrecise requires number elements.");
      }
      seenAny = true;
      if (!(n === 0 && 1 / n === -Infinity)) {
        allNegZero = false;
      }
      y = n - comp;
      t = sum + y;
      comp = (t - sum) - y;
      sum = t;
    }

    if (!seenAny || (sum === 0 && allNegZero)) {
      return -0;
    }
    return sum;
  }

  function mapGetOrInsert(mapOrStore, key, defaultValue) {
    if (mapOrStore && typeof mapOrStore.getOrInsert === "function") {
      return mapOrStore.getOrInsert(key, defaultValue);
    }
    if (mapOrStore && typeof mapOrStore.has === "function" && typeof mapOrStore.set === "function") {
      if (mapOrStore.has(key)) {
        return mapOrStore.get(key);
      }
      mapOrStore.set(key, defaultValue);
      return defaultValue;
    }
    if (mapOrStore && typeof mapOrStore === "object") {
      var k = String(key);
      if (!mapOrStore.hasOwnProperty(k)) {
        mapOrStore[k] = defaultValue;
      }
      return mapOrStore[k];
    }
    return defaultValue;
  }

  function mapGetOrInsertComputed(mapOrStore, key, callbackFn) {
    var computed;
    if (mapOrStore && typeof mapOrStore.getOrInsertComputed === "function") {
      return mapOrStore.getOrInsertComputed(key, callbackFn);
    }
    if (mapOrStore && typeof mapOrStore.has === "function" && typeof mapOrStore.set === "function") {
      if (mapOrStore.has(key)) {
        return mapOrStore.get(key);
      }
      computed = typeof callbackFn === "function" ? callbackFn(key) : undefined;
      mapOrStore.set(key, computed);
      return computed;
    }
    if (mapOrStore && typeof mapOrStore === "object") {
      var k = String(key);
      if (!mapOrStore.hasOwnProperty(k)) {
        mapOrStore[k] = typeof callbackFn === "function" ? callbackFn(key) : undefined;
      }
      return mapOrStore[k];
    }
    return typeof callbackFn === "function" ? callbackFn(key) : undefined;
  }

  function concatIterables() {
    var out = [];
    var i;
    var j;
    var item;
    if (typeof root.Iterator !== "undefined" && typeof root.Iterator.concat === "function") {
      try {
        return root.Iterator.concat.apply(root.Iterator, arguments);
      } catch (e) {}
    }
    for (i = 0; i < arguments.length; i++) {
      item = arguments[i];
      if (isArrayValue(item)) {
        for (j = 0; j < item.length; j++) {
          out.push(item[j]);
        }
      } else if (item && typeof item.length === "number" && typeof item !== "string") {
        for (j = 0; j < item.length; j++) {
          out.push(item[j]);
        }
      } else if (item !== undefined) {
        out.push(item);
      }
    }
    return out;
  }

  var HEX_CHARS = "0123456789abcdef";
  var B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  function bytesToHex(bytes) {
    var out = "";
    var i;
    var b;
    if (!bytes) {
      return "";
    }
    if (typeof bytes.toHex === "function") {
      return bytes.toHex();
    }
    for (i = 0; i < bytes.length; i++) {
      b = bytes[i] & 0xff;
      out += HEX_CHARS.charAt((b >> 4) & 0x0f) + HEX_CHARS.charAt(b & 0x0f);
    }
    return out;
  }

  function hexToBytes(hexStr) {
    var clean = String(hexStr || "").replace(/\s+/g, "");
    var len = clean.length;
    var outArr = [];
    var i;
    var hi;
    var lo;

    if (len % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) {
      throw new SyntaxError("Invalid hex string");
    }
    if (typeof root.Uint8Array !== "undefined" && typeof root.Uint8Array.fromHex === "function") {
      return root.Uint8Array.fromHex(clean);
    }
    for (i = 0; i < len; i += 2) {
      hi = parseInt(clean.charAt(i), 16);
      lo = parseInt(clean.charAt(i + 1), 16);
      outArr.push((hi << 4) | lo);
    }
    if (typeof root.Uint8Array !== "undefined") {
      return new root.Uint8Array(outArr);
    }
    return outArr;
  }

  function bytesToBase64(bytes) {
    var out = "";
    var i;
    var b1;
    var b2;
    var b3;

    if (!bytes) {
      return "";
    }
    if (typeof bytes.toBase64 === "function") {
      return bytes.toBase64();
    }
    for (i = 0; i < bytes.length; i += 3) {
      b1 = bytes[i] & 0xff;
      b2 = i + 1 < bytes.length ? bytes[i + 1] & 0xff : NaN;
      b3 = i + 2 < bytes.length ? bytes[i + 2] & 0xff : NaN;

      out += B64_CHARS.charAt(b1 >> 2);
      out += B64_CHARS.charAt(((b1 & 0x03) << 4) | (isNaN(b2) ? 0 : (b2 >> 4)));
      if (isNaN(b2)) {
        out += "==";
      } else {
        out += B64_CHARS.charAt(((b2 & 0x0f) << 2) | (isNaN(b3) ? 0 : (b3 >> 6)));
        out += isNaN(b3) ? "=" : B64_CHARS.charAt(b3 & 0x3f);
      }
    }
    return out;
  }

  function base64ToBytes(b64Str) {
    var clean = String(b64Str || "").replace(/[\s=]+$/g, "");
    var outArr = [];
    var i;
    var c1;
    var c2;
    var c3;
    var c4;

    if (typeof root.Uint8Array !== "undefined" && typeof root.Uint8Array.fromBase64 === "function") {
      return root.Uint8Array.fromBase64(String(b64Str || ""));
    }
    for (i = 0; i < clean.length; i += 4) {
      c1 = B64_CHARS.indexOf(clean.charAt(i));
      c2 = i + 1 < clean.length ? B64_CHARS.indexOf(clean.charAt(i + 1)) : -1;
      c3 = i + 2 < clean.length ? B64_CHARS.indexOf(clean.charAt(i + 2)) : -1;
      c4 = i + 3 < clean.length ? B64_CHARS.indexOf(clean.charAt(i + 3)) : -1;
      if (c1 < 0 || c2 < 0) {
        throw new SyntaxError("Invalid base64 string");
      }
      outArr.push((c1 << 2) | (c2 >> 4));
      if (c3 >= 0) {
        outArr.push(((c2 & 0x0f) << 4) | (c3 >> 2));
      }
      if (c4 >= 0) {
        outArr.push(((c3 & 0x03) << 6) | c4);
      }
    }
    if (typeof root.Uint8Array !== "undefined") {
      return new root.Uint8Array(outArr);
    }
    return outArr;
  }

  function createRawJSON(rawText) {
    var str = String(rawText);
    if (typeof root.JSON !== "undefined" && typeof root.JSON.rawJSON === "function") {
      return root.JSON.rawJSON(str);
    }
    return { __legacyRawJson: str };
  }

  function isRawJSON(val) {
    if (typeof root.JSON !== "undefined" && typeof root.JSON.isRawJSON === "function") {
      return root.JSON.isRawJSON(val);
    }
    return Boolean(val && typeof val === "object" && typeof val.__legacyRawJson === "string");
  }

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

    if (isRawJSON(val)) {
      return val.__legacyRawJson;
    }
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
    var ctx = {
      source: typeof val === "string" || typeof val === "number" || typeof val === "boolean" || val === null
        ? es3Stringify(val)
        : undefined
    };

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

    return reviver.call(holder, key, val, ctx);
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
    if (typeof root.JSON !== "undefined" && typeof root.JSON.stringify === "function" && !isRawJSON(val)) {
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
      self.then(
        function (val) { resolve(val); },
        function (err) { reject(err); }
      );
    });
  };

  function withResolversDeferred() {
    var d = new Deferred();
    if (typeof root.Promise === "function" && typeof root.Promise.withResolvers === "function") {
      try {
        var nativePair = root.Promise.withResolvers();
        return {
          promise: d,
          nativePromise: nativePair.promise,
          resolve: function (v) {
            d.resolve(v);
            nativePair.resolve(v);
          },
          reject: function (e) {
            d.reject(e);
            nativePair.reject(e);
          }
        };
      } catch (e) {}
    }
    return {
      promise: d,
      nativePromise: d.toNativePromise(),
      resolve: function (v) { d.resolve(v); },
      reject: function (e) { d.reject(e); }
    };
  }

  function tryCallDeferred(fn, thisArg, argsArr) {
    var d = new Deferred();
    var callArgs = argsArr || [];
    scheduleAsync(function () {
      var res;
      try {
        res = typeof fn === "function" ? fn.apply(thisArg || null, callArgs) : fn;
        d.resolve(res);
      } catch (err) {
        d.reject(err);
      }
    });
    return d;
  }

  function fromAsyncDeferred(source, mapFn, thisArg) {
    var d = new Deferred();
    var out = [];
    var idx = 0;

    if (typeof Array.fromAsync === "function") {
      try {
        Array.fromAsync(source, mapFn, thisArg).then(
          function (arr) { d.resolve(arr); },
          function (err) { d.reject(err); }
        );
        return d;
      } catch (e) {}
    }

    if (!source) {
      d.resolve([]);
      return d;
    }

    function stepNext(val) {
      var mapped;
      try {
        mapped = typeof mapFn === "function" ? mapFn.call(thisArg, val, idx) : val;
      } catch (mapErr) {
        d.reject(mapErr);
        return;
      }
      if (mapped && typeof mapped.then === "function") {
        mapped.then(
          function (resolvedVal) {
            out.push(resolvedVal);
            idx++;
            d.resolve(out.slice(0));
          },
          function (err) { d.reject(err); }
        );
      } else {
        out.push(mapped);
        idx++;
        d.resolve(out.slice(0));
      }
    }

    if (isArrayValue(source) || typeof source.length === "number") {
      var items = [];
      var i;
      for (i = 0; i < source.length; i++) {
        items.push(source[i]);
      }
      allDeferred(items).then(function (resolvedItems) {
        var j;
        var mappedItems = [];
        try {
          for (j = 0; j < resolvedItems.length; j++) {
            mappedItems.push(typeof mapFn === "function" ? mapFn.call(thisArg, resolvedItems[j], j) : resolvedItems[j]);
          }
        } catch (err) {
          d.reject(err);
          return;
        }
        allDeferred(mappedItems).then(function (finalArr) {
          d.resolve(finalArr);
        }, function (err) {
          d.reject(err);
        });
      }, function (err) {
        d.reject(err);
      });
      return d;
    }

    stepNext(source);
    return d;
  }

  function asDeferred(item) {
    var d = new Deferred();
    if (item && typeof item.then === "function") {
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
    var results = [];
    var remaining;
    var i;

    if (!isArrayValue(items) || items.length === 0) {
      d.resolve([]);
      return d;
    }

    remaining = items.length;
    for (i = 0; i < items.length; i++) {
      (function (idx) {
        asDeferred(items[idx]).then(
          function (val) {
            results[idx] = val;
            remaining--;
            if (remaining === 0) {
              d.resolve(results);
            }
          },
          function (err) {
            d.reject(err);
          }
        );
      })(i);
    }
    return d;
  }

  function raceDeferred(items) {
    var d = new Deferred();
    var i;

    if (!isArrayValue(items)) {
      d.reject(new TypeError("race expects an array."));
      return d;
    }

    for (i = 0; i < items.length; i++) {
      asDeferred(items[i]).then(
        function (val) { d.resolve(val); },
        function (err) { d.reject(err); }
      );
    }
    return d;
  }

  function anyDeferred(items) {
    var d = new Deferred();
    var errors = [];
    var remaining;
    var i;

    if (!isArrayValue(items) || items.length === 0) {
      d.reject(new Error("All promises were rejected"));
      return d;
    }

    remaining = items.length;
    for (i = 0; i < items.length; i++) {
      (function (idx) {
        asDeferred(items[idx]).then(
          function (val) {
            d.resolve(val);
          },
          function (err) {
            errors[idx] = err;
            remaining--;
            if (remaining === 0) {
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
    var outcomes = [];
    var remaining;
    var i;

    if (!isArrayValue(items) || items.length === 0) {
      d.resolve([]);
      return d;
    }

    remaining = items.length;
    for (i = 0; i < items.length; i++) {
      (function (idx) {
        asDeferred(items[idx]).then(
          function (val) {
            outcomes[idx] = { status: "fulfilled", value: val };
            remaining--;
            if (remaining === 0) {
              d.resolve(outcomes);
            }
          },
          function (reason) {
            outcomes[idx] = { status: "rejected", reason: reason };
            remaining--;
            if (remaining === 0) {
              d.resolve(outcomes);
            }
          }
        );
      })(i);
    }
    return d;
  }

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
    var hasObjectKeys = typeof Object.keys === "function";
    var hasDateNow = typeof Date !== "undefined" && typeof Date.now === "function";
    var hasJSON = typeof root.JSON !== "undefined" &&
      typeof root.JSON.parse === "function" &&
      typeof root.JSON.stringify === "function";
    var hasFetch = typeof root.fetch === "function";
    var hasAbortController = typeof root.AbortController === "function";
    var hasWebSocket = typeof root.WebSocket === "function";
    var rtcCtor = getPeerConnectionCtor();

    var hasEs7Includes = typeof Array.prototype.includes === "function";
    var hasEs8ObjectEntries = typeof Object.entries === "function" && typeof Object.values === "function";
    var hasEs10Flat = typeof Array.prototype.flat === "function" && typeof Object.fromEntries === "function";
    var hasEs11GlobalThis = typeof globalThis !== "undefined";
    var hasEs12ReplaceAll = typeof String.prototype.replaceAll === "function";
    var hasEs13At = typeof Array.prototype.at === "function";
    var hasEs14ArrayCopy = typeof Array.prototype.toSorted === "function" && typeof Array.prototype.findLast === "function";
    var hasEs15GroupBy = typeof Object.groupBy === "function" || (hasPromise && typeof root.Promise.withResolvers === "function");
    var hasEs16PromiseTry = hasPromise && typeof root.Promise["try"] === "function";
    var hasEs2026ErrorIsError = typeof root.Error !== "undefined" && typeof root.Error.isError === "function";
    var hasEs2026MathSumPrecise = typeof Math !== "undefined" && typeof Math.sumPrecise === "function";
    var hasEs2026FromAsync = typeof Array.fromAsync === "function";
    var hasEs2026Uint8Base64 = typeof root.Uint8Array !== "undefined" && typeof root.Uint8Array.fromBase64 === "function";
    var hasEs2026JsonRaw = hasJSON && typeof root.JSON.rawJSON === "function";

    var edition = "ES3";
    if (hasEs2026ErrorIsError || hasEs2026MathSumPrecise || hasEs2026FromAsync || hasEs2026Uint8Base64 || hasEs2026JsonRaw) {
      edition = "ES2026/ES17+";
    } else if (hasEs16PromiseTry || hasEs15GroupBy || hasEs14ArrayCopy || hasEs13At || hasEs12ReplaceAll || hasEs11GlobalThis || hasEs10Flat || hasEs8ObjectEntries || hasEs7Includes || hasPromise || hasObjectAssign || hasFetch) {
      edition = hasEs16PromiseTry ? "ES16/ES2025+" :
        hasEs15GroupBy ? "ES15/ES2024+" :
        hasEs14ArrayCopy ? "ES14/ES2023+" :
        hasEs13At ? "ES13/ES2022+" :
        hasEs12ReplaceAll ? "ES12/ES2021+" :
        hasEs11GlobalThis ? "ES11/ES2020+" :
        hasEs10Flat ? "ES10/ES2019+" :
        hasEs8ObjectEntries ? "ES8/ES2017+" :
        hasEs7Includes ? "ES7/ES2016+" : "ES6+";
    } else if (hasJSON || hasArrayIsArray || hasObjectKeys || hasDateNow) {
      edition = "ES5+";
    }

    return {
      detectedEdition: edition,
      es5ArrayIsArray: hasArrayIsArray,
      es5Json: hasJSON,
      es5ObjectKeys: hasObjectKeys,
      es5DateNow: hasDateNow,
      es6Promise: hasPromise,
      es6ObjectAssign: hasObjectAssign,
      es7Includes: hasEs7Includes,
      es8ObjectEntries: hasEs8ObjectEntries,
      es10Flat: hasEs10Flat,
      es11GlobalThis: hasEs11GlobalThis,
      es12ReplaceAll: hasEs12ReplaceAll,
      es13At: hasEs13At,
      es14ArrayCopy: hasEs14ArrayCopy,
      es15GroupBy: hasEs15GroupBy,
      es16PromiseTry: hasEs16PromiseTry,
      es2026ErrorIsError: hasEs2026ErrorIsError,
      es2026MathSumPrecise: hasEs2026MathSumPrecise,
      es2026FromAsync: hasEs2026FromAsync,
      es2026Uint8Base64: hasEs2026Uint8Base64,
      es2026JsonRaw: hasEs2026JsonRaw,
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
    version: "1.0.0 BETA",
    capabilities: capabilities,
    deferred: function (onAbort) {
      return new Deferred(onAbort);
    },
    withResolvers: withResolversDeferred,
    tryCall: tryCallDeferred,
    fromAsync: fromAsyncDeferred,
    all: allDeferred,
    race: raceDeferred,
    any: anyDeferred,
    allSettled: allSettledDeferred,
    json: {
      stringify: safeStringify,
      parse: safeParse,
      rawJSON: createRawJSON,
      isRawJSON: isRawJSON
    },
    utils: {
      globalObj: root,
      isArray: isArrayValue,
      isError: isErrorValue,
      merge: mergeObjects,
      keys: getKeys,
      values: getValues,
      entries: getEntries,
      fromEntries: fromEntriesSafe,
      freezeSafe: freezeSafe,
      now: nowMs,
      includes: includesValue,
      flat: flatArray,
      flatMap: flatMapArray,
      replaceAll: replaceAllString,
      at: atIndex,
      withCause: withCause,
      toReversed: toReversedArray,
      toSorted: toSortedArray,
      toSpliced: toSplicedArray,
      withItem: withArrayItem,
      findLast: findLastItem,
      findLastIndex: findLastIndexItem,
      groupBy: groupByKey,
      isWellFormed: isWellFormedStr,
      toWellFormed: toWellFormedStr,
      sumPrecise: sumPreciseNumbers,
      mapGetOrInsert: mapGetOrInsert,
      mapGetOrInsertComputed: mapGetOrInsertComputed,
      concatIterables: concatIterables,
      toHex: bytesToHex,
      fromHex: hexToBytes,
      toBase64: bytesToBase64,
      fromBase64: base64ToBytes,
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

        if (typeof body === "object" && body !== null && !isBinaryOrFormData(body) && !isRawJSON(body)) {
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
          emitFinalError(withCause(err, opts.cause));
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

          if (typeof opts.credentials === "string") {
            fetchOpts.credentials = opts.credentials;
          }

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

        if (typeof opts.withCredentials === "boolean") {
          try {
            xhr.withCredentials = opts.withCredentials;
          } catch (wcErr) {}
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

    connectSocket: function (url, protocols, sockOpts) {
      var d = new Deferred();
      var opts = sockOpts || {};
      var ws;
      var pingTimer = null;

      if (typeof root.WebSocket !== "function") {
        d.reject(new Error("WebSocket is not supported by this host environment."));
        return d;
      }
      ws = protocols ? new root.WebSocket(url, protocols) : new root.WebSocket(url);

      if (typeof opts.binaryType === "string") {
        try {
          ws.binaryType = opts.binaryType;
        } catch (btErr) {}
      }

      function stopPing() {
        if (pingTimer !== null && typeof root.clearInterval === "function") {
          root.clearInterval(pingTimer);
          pingTimer = null;
        }
      }

      ws.onopen = function (ev) {
        if (typeof opts.pingInterval === "number" && opts.pingInterval > 0 && typeof root.setInterval === "function") {
          pingTimer = root.setInterval(function () {
            if (ws.readyState === 1) {
              try {
                ws.send(opts.pingPayload || '{"type":"ping"}');
              } catch (pErr) {}
            }
          }, opts.pingInterval);
        }
        d.resolve({ socket: ws, event: ev, stopPing: stopPing });
      };

      ws.onclose = function () {
        stopPing();
      };

      ws.onerror = function (ev) {
        stopPing();
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
