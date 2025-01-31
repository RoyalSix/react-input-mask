'use strict';

var React = require('react');
var PropTypes = require('prop-types');
var invariant = require('invariant');
var warning = require('warning');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var PropTypes__default = /*#__PURE__*/_interopDefaultLegacy(PropTypes);
var invariant__default = /*#__PURE__*/_interopDefaultLegacy(invariant);
var warning__default = /*#__PURE__*/_interopDefaultLegacy(warning);

function _defaults2(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;

  _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    _defaults2(o, p);

    return o;
  };

  return _setPrototypeOf(o, p);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function defer(fn) {
  return requestAnimationFrame(fn);
}
function cancelDefer(deferId) {
  cancelAnimationFrame(deferId);
}

function setInputSelection(input, start, end) {
  if (end === undefined) {
    end = start;
  }

  input.setSelectionRange(start, end);
}
function getInputSelection(input) {
  var start = input.selectionStart;
  var end = input.selectionEnd;
  return {
    start: start,
    end: end,
    length: end - start
  };
}
function isInputFocused(input) {
  var inputDocument = input.ownerDocument;
  return inputDocument.hasFocus() && inputDocument.activeElement === input;
}

// Element's window may differ from the one within React instance
// if element rendered within iframe.
// See https://github.com/sanniassin/react-input-mask/issues/182
function getElementDocument(element) {
  return element == null ? void 0 : element.ownerDocument;
}
function getElementWindow(element) {
  var _getElementDocument;

  return (_getElementDocument = getElementDocument(element)) == null ? void 0 : _getElementDocument.defaultView;
}
function isDOMElement(element) {
  var elementWindow = getElementWindow(element);
  return !!elementWindow && element instanceof elementWindow.HTMLElement;
}
function isFunction(value) {
  return typeof value === "function";
}
function findLastIndex(array, predicate) {
  for (var i = array.length - 1; i >= 0; i--) {
    var x = array[i];

    if (predicate(x, i)) {
      return i;
    }
  }

  return -1;
}
function repeat(string, n) {
  if (n === void 0) {
    n = 1;
  }

  var result = "";

  for (var i = 0; i < n; i++) {
    result += string;
  }

  return result;
}
function toString(value) {
  return "" + value;
}

function useInputElement(inputRef) {
  return React.useCallback(function () {
    var input = inputRef.current;
    var isDOMNode = typeof window !== "undefined" && isDOMElement(input); // workaround for react-test-renderer
    // https://github.com/sanniassin/react-input-mask/issues/147

    if (!input || !isDOMNode) {
      return null;
    }

    if (input.nodeName !== "INPUT") {
      input = input.querySelector("input");
    }

    if (!input) {
      throw new Error("react-input-mask: inputComponent doesn't contain input node");
    }

    return input;
  }, [inputRef]);
}

function useDeferLoop(callback) {
  var deferIdRef = React.useRef(null);
  var runLoop = React.useCallback(function () {
    // If there are simulated focus events, runLoop could be
    // called multiple times without blur or re-render
    if (deferIdRef.current !== null) {
      return;
    }

    function loop() {
      callback();
      deferIdRef.current = defer(loop);
    }

    loop();
  }, [callback]);
  var stopLoop = React.useCallback(function () {
    cancelDefer(deferIdRef.current);
    deferIdRef.current = null;
  }, []);
  React.useEffect(function () {
    if (deferIdRef.current) {
      stopLoop();
      runLoop();
    }
  }, [runLoop, stopLoop]);
  React.useEffect(cancelDefer, []);
  return [runLoop, stopLoop];
}

function useSelection(inputRef, isMasked) {
  var selectionRef = React.useRef({
    start: null,
    end: null
  });
  var getInputElement = useInputElement(inputRef);
  var getSelection = React.useCallback(function () {
    var input = getInputElement();
    return getInputSelection(input);
  }, [getInputElement]);
  var getLastSelection = React.useCallback(function () {
    return selectionRef.current;
  }, []);
  var setSelection = React.useCallback(function (selection) {
    var input = getInputElement(); // Don't change selection on unfocused input
    // because Safari sets focus on selection change (#154)

    if (!input || !isInputFocused(input)) {
      return;
    }

    setInputSelection(input, selection.start, selection.end); // Use actual selection in case the requested one was out of range

    selectionRef.current = getSelection();
  }, [getInputElement, getSelection]);
  var selectionLoop = React.useCallback(function () {
    selectionRef.current = getSelection();
  }, [getSelection]);

  var _useDeferLoop = useDeferLoop(selectionLoop),
      runSelectionLoop = _useDeferLoop[0],
      stopSelectionLoop = _useDeferLoop[1];

  React.useLayoutEffect(function () {
    if (!isMasked) {
      return;
    }

    var input = getInputElement();
    input.addEventListener("focus", runSelectionLoop);
    input.addEventListener("blur", stopSelectionLoop);

    if (isInputFocused(input)) {
      runSelectionLoop();
    }

    return function () {
      input.removeEventListener("focus", runSelectionLoop);
      input.removeEventListener("blur", stopSelectionLoop);
      stopSelectionLoop();
    };
  });
  return {
    getSelection: getSelection,
    getLastSelection: getLastSelection,
    setSelection: setSelection
  };
}

function useValue(inputRef, initialValue) {
  var getInputElement = useInputElement(inputRef);
  var valueRef = React.useRef(initialValue);
  var getValue = React.useCallback(function () {
    var input = getInputElement();
    return input.value;
  }, [getInputElement]);
  var getLastValue = React.useCallback(function () {
    return valueRef.current;
  }, []);
  var setValue = React.useCallback(function (newValue) {
    valueRef.current = newValue;
    var input = getInputElement();

    if (input) {
      input.value = newValue;
    }
  }, [getInputElement]);
  return {
    getValue: getValue,
    getLastValue: getLastValue,
    setValue: setValue
  };
}

function useInputState(initialValue, isMasked) {
  var inputRef = React.useRef();

  var _useSelection = useSelection(inputRef, isMasked),
      getSelection = _useSelection.getSelection,
      getLastSelection = _useSelection.getLastSelection,
      setSelection = _useSelection.setSelection;

  var _useValue = useValue(inputRef, initialValue),
      getValue = _useValue.getValue,
      getLastValue = _useValue.getLastValue,
      setValue = _useValue.setValue;

  function getLastInputState() {
    return {
      value: getLastValue(),
      selection: getLastSelection()
    };
  }

  function getInputState() {
    return {
      value: getValue(),
      selection: getSelection()
    };
  }

  function setInputState(_ref) {
    var value = _ref.value,
        selection = _ref.selection;
    setValue(value);
    setSelection(selection);
  }

  return {
    inputRef: inputRef,
    getInputState: getInputState,
    getLastInputState: getLastInputState,
    setInputState: setInputState
  };
}
function usePrevious(value) {
  var ref = React.useRef();
  React.useEffect(function () {
    ref.current = value;
  });
  return ref.current;
}

var CONTROLLED_PROPS = ["disabled", "onBlur", "onChange", "onFocus", "onMouseDown", "readOnly", "value"];
var defaultFormatChars = {
  9: /[0-9]/,
  a: /[A-Za-z]/,
  "*": /[A-Za-z0-9]/
};

function validateMaxLength(props) {
  process.env.NODE_ENV !== "production" ? warning__default["default"](!props.maxLength || !props.mask, "react-input-mask: maxLength property shouldn't be passed to the masked input. It breaks masking and unnecessary because length is limited by the mask length.") : void 0;
}
function validateMaskPlaceholder(props) {
  var mask = props.mask,
      maskPlaceholder = props.maskPlaceholder;
  !(!mask || !maskPlaceholder || maskPlaceholder.length === 1 || maskPlaceholder.length === mask.length) ? process.env.NODE_ENV !== "production" ? invariant__default["default"](false, "react-input-mask: maskPlaceholder should either be a single character or have the same length as the mask:\n" + ("mask: " + mask + "\n") + ("maskPlaceholder: " + maskPlaceholder)) : invariant__default["default"](false) : void 0;
}
function validateChildren(props, inputElement) {
  var conflictProps = CONTROLLED_PROPS.filter(function (propId) {
    return inputElement.props[propId] != null && inputElement.props[propId] !== props[propId];
  });
  !!conflictProps.length ? process.env.NODE_ENV !== "production" ? invariant__default["default"](false, "react-input-mask: the following props should be passed to the InputMask component, not to children: " + conflictProps.join(",")) : invariant__default["default"](false) : void 0;
}

function parseMask (_ref) {
  var mask = _ref.mask,
      maskPlaceholder = _ref.maskPlaceholder;
  var permanents = [];

  if (!mask) {
    return {
      maskPlaceholder: null,
      mask: null,
      prefix: null,
      lastEditablePosition: null,
      permanents: []
    };
  }

  if (typeof mask === "string") {
    var isPermanent = false;
    var parsedMaskString = "";
    mask.split("").forEach(function (character) {
      if (!isPermanent && character === "\\") {
        isPermanent = true;
      } else {
        if (isPermanent || !defaultFormatChars[character]) {
          permanents.push(parsedMaskString.length);
        }

        parsedMaskString += character;
        isPermanent = false;
      }
    });
    mask = parsedMaskString.split("").map(function (character, index) {
      if (permanents.indexOf(index) === -1) {
        return defaultFormatChars[character];
      }

      return character;
    });
  } else {
    mask.forEach(function (character, index) {
      if (typeof character === "string") {
        permanents.push(index);
      }
    });
  }

  if (maskPlaceholder) {
    if (maskPlaceholder.length === 1) {
      maskPlaceholder = mask.map(function (character, index) {
        if (permanents.indexOf(index) !== -1) {
          return character;
        }

        return maskPlaceholder;
      });
    } else {
      maskPlaceholder = maskPlaceholder.split("");
    }

    permanents.forEach(function (position) {
      maskPlaceholder[position] = mask[position];
    });
    maskPlaceholder = maskPlaceholder.join("");
  }

  var prefix = permanents.filter(function (position, index) {
    return position === index;
  }).map(function (position) {
    return mask[position];
  }).join("");
  var lastEditablePosition = mask.length - 1;

  while (permanents.indexOf(lastEditablePosition) !== -1) {
    lastEditablePosition--;
  }

  return {
    maskPlaceholder: maskPlaceholder,
    prefix: prefix,
    mask: mask,
    lastEditablePosition: lastEditablePosition,
    permanents: permanents
  };
}

/* eslint no-use-before-define: ["error", { functions: false }] */

var MaskUtils = function MaskUtils(options) {
  var _this = this;

  this.isCharacterAllowedAtPosition = function (character, position) {
    var maskPlaceholder = _this.maskOptions.maskPlaceholder;

    if (_this.isCharacterFillingPosition(character, position)) {
      return true;
    }

    if (!maskPlaceholder) {
      return false;
    }

    return maskPlaceholder[position] === character;
  };

  this.isCharacterFillingPosition = function (character, position) {
    var mask = _this.maskOptions.mask;

    if (!character || position >= mask.length) {
      return false;
    }

    if (!_this.isPositionEditable(position)) {
      return mask[position] === character;
    }

    var charRule = mask[position];
    return new RegExp(charRule).test(character);
  };

  this.isPositionEditable = function (position) {
    var _this$maskOptions = _this.maskOptions,
        mask = _this$maskOptions.mask,
        permanents = _this$maskOptions.permanents;
    return position < mask.length && permanents.indexOf(position) === -1;
  };

  this.isValueEmpty = function (value) {
    return value.split("").every(function (character, position) {
      return !_this.isPositionEditable(position) || !_this.isCharacterFillingPosition(character, position);
    });
  };

  this.isValueFilled = function (value) {
    return _this.getFilledLength(value) === _this.maskOptions.lastEditablePosition + 1;
  };

  this.getDefaultSelectionForValue = function (value) {
    var filledLength = _this.getFilledLength(value);

    var cursorPosition = _this.getRightEditablePosition(filledLength);

    return {
      start: cursorPosition,
      end: cursorPosition
    };
  };

  this.getFilledLength = function (value) {
    var characters = value.split("");
    var lastFilledIndex = findLastIndex(characters, function (character, position) {
      return _this.isPositionEditable(position) && _this.isCharacterFillingPosition(character, position);
    });
    return lastFilledIndex + 1;
  };

  this.getStringFillingLengthAtPosition = function (string, position) {
    var characters = string.split("");
    var insertedValue = characters.reduce(function (value, character) {
      return _this.insertCharacterAtPosition(value, character, value.length);
    }, repeat(" ", position));
    return insertedValue.length - position;
  };

  this.getLeftEditablePosition = function (position) {
    for (var i = position; i >= 0; i--) {
      if (_this.isPositionEditable(i)) {
        return i;
      }
    }

    return null;
  };

  this.getRightEditablePosition = function (position) {
    var mask = _this.maskOptions.mask;

    for (var i = position; i < mask.length; i++) {
      if (_this.isPositionEditable(i)) {
        return i;
      }
    }

    return null;
  };

  this.formatValue = function (value) {
    var _this$maskOptions2 = _this.maskOptions,
        maskPlaceholder = _this$maskOptions2.maskPlaceholder,
        mask = _this$maskOptions2.mask;

    if (!maskPlaceholder) {
      value = _this.insertStringAtPosition("", value, 0);

      while (value.length < mask.length && !_this.isPositionEditable(value.length)) {
        value += mask[value.length];
      }

      return value;
    }

    return _this.insertStringAtPosition(maskPlaceholder, value, 0);
  };

  this.clearRange = function (value, start, len) {
    if (!len) {
      return value;
    }

    var end = start + len;
    var _this$maskOptions3 = _this.maskOptions,
        maskPlaceholder = _this$maskOptions3.maskPlaceholder,
        mask = _this$maskOptions3.mask;
    var clearedValue = value.split("").map(function (character, i) {
      var isEditable = _this.isPositionEditable(i);

      if (!maskPlaceholder && i >= end && !isEditable) {
        return "";
      }

      if (i < start || i >= end) {
        return character;
      }

      if (!isEditable) {
        return mask[i];
      }

      if (maskPlaceholder) {
        return maskPlaceholder[i];
      }

      return "";
    }).join("");
    return _this.formatValue(clearedValue);
  };

  this.insertCharacterAtPosition = function (value, character, position) {
    var _this$maskOptions4 = _this.maskOptions,
        mask = _this$maskOptions4.mask,
        maskPlaceholder = _this$maskOptions4.maskPlaceholder;

    if (position >= mask.length) {
      return value;
    }

    var isAllowed = _this.isCharacterAllowedAtPosition(character, position);

    var isEditable = _this.isPositionEditable(position);

    var nextEditablePosition = _this.getRightEditablePosition(position);

    var isNextPlaceholder = maskPlaceholder && nextEditablePosition ? character === maskPlaceholder[nextEditablePosition] : null;
    var valueBefore = value.slice(0, position);

    if (isAllowed || !isEditable) {
      var insertedCharacter = isAllowed ? character : mask[position];
      value = valueBefore + insertedCharacter;
    }

    if (!isAllowed && !isEditable && !isNextPlaceholder) {
      value = _this.insertCharacterAtPosition(value, character, position + 1);
    }

    return value;
  };

  this.insertStringAtPosition = function (value, string, position) {
    var _this$maskOptions5 = _this.maskOptions,
        mask = _this$maskOptions5.mask,
        maskPlaceholder = _this$maskOptions5.maskPlaceholder;

    if (!string || position >= mask.length) {
      return value;
    }

    var characters = string.split("");
    var isFixedLength = _this.isValueFilled(value) || !!maskPlaceholder;
    var valueAfter = value.slice(position);
    value = characters.reduce(function (value, character) {
      return _this.insertCharacterAtPosition(value, character, value.length);
    }, value.slice(0, position));

    if (isFixedLength) {
      value += valueAfter.slice(value.length - position);
    } else if (_this.isValueFilled(value)) {
      value += mask.slice(value.length).join("");
    } else {
      var editableCharactersAfter = valueAfter.split("").filter(function (character, i) {
        return _this.isPositionEditable(position + i);
      });
      value = editableCharactersAfter.reduce(function (value, character) {
        var nextEditablePosition = _this.getRightEditablePosition(value.length);

        if (nextEditablePosition === null) {
          return value;
        }

        if (!_this.isPositionEditable(value.length)) {
          value += mask.slice(value.length, nextEditablePosition).join("");
        }

        return _this.insertCharacterAtPosition(value, character, value.length);
      }, value);
    }

    return value;
  };

  this.processChange = function (currentState, previousState) {
    var _this$maskOptions6 = _this.maskOptions,
        mask = _this$maskOptions6.mask,
        prefix = _this$maskOptions6.prefix,
        lastEditablePosition = _this$maskOptions6.lastEditablePosition;
    var value = currentState.value,
        selection = currentState.selection;
    var previousValue = previousState.value;
    var previousSelection = previousState.selection;
    var newValue = value;
    var enteredString = "";
    var formattedEnteredStringLength = 0;
    var removedLength = 0;
    var cursorPosition = Math.min(previousSelection.start, selection.start);

    if (selection.end > previousSelection.start) {
      enteredString = newValue.slice(previousSelection.start, selection.end);
      formattedEnteredStringLength = _this.getStringFillingLengthAtPosition(enteredString, cursorPosition);

      if (!formattedEnteredStringLength) {
        removedLength = 0;
      } else {
        removedLength = previousSelection.length;
      }
    } else if (newValue.length < previousValue.length) {
      removedLength = previousValue.length - newValue.length;
    }

    newValue = previousValue;

    if (removedLength) {
      if (removedLength === 1 && !previousSelection.length) {
        var deleteFromRight = previousSelection.start === selection.start;
        cursorPosition = deleteFromRight ? _this.getRightEditablePosition(selection.start) : _this.getLeftEditablePosition(selection.start);
      }

      newValue = _this.clearRange(newValue, cursorPosition, removedLength);
    }

    newValue = _this.insertStringAtPosition(newValue, enteredString, cursorPosition);
    cursorPosition += formattedEnteredStringLength;

    if (cursorPosition >= mask.length) {
      cursorPosition = mask.length;
    } else if (cursorPosition < prefix.length && !formattedEnteredStringLength) {
      cursorPosition = prefix.length;
    } else if (cursorPosition >= prefix.length && cursorPosition < lastEditablePosition && formattedEnteredStringLength) {
      cursorPosition = _this.getRightEditablePosition(cursorPosition);
    }

    newValue = _this.formatValue(newValue);
    return {
      value: newValue,
      enteredString: enteredString,
      selection: {
        start: cursorPosition,
        end: cursorPosition
      }
    };
  };

  this.maskOptions = parseMask(options);
};

var _excluded$1 = ["children"];

var InputMaskChildrenWrapper = /*#__PURE__*/function (_React$Component) {
  _inheritsLoose(InputMaskChildrenWrapper, _React$Component);

  function InputMaskChildrenWrapper() {
    return _React$Component.apply(this, arguments) || this;
  }

  var _proto = InputMaskChildrenWrapper.prototype;

  _proto.render = function render() {
    // eslint-disable-next-line react/prop-types
    var _this$props = this.props,
        children = _this$props.children,
        props = _objectWithoutPropertiesLoose(_this$props, _excluded$1);

    return /*#__PURE__*/React__default["default"].cloneElement(children, props);
  };

  return InputMaskChildrenWrapper;
}(React__default["default"].Component);

var _excluded = ["alwaysShowMask", "children", "mask", "maskPlaceholder", "beforeMaskedStateChange"];
var InputMask = /*#__PURE__*/React.forwardRef(function (props, forwardedRef) {
  var alwaysShowMask = props.alwaysShowMask,
      children = props.children,
      mask = props.mask,
      maskPlaceholder = props.maskPlaceholder,
      beforeMaskedStateChange = props.beforeMaskedStateChange,
      restProps = _objectWithoutPropertiesLoose(props, _excluded);

  validateMaxLength(props);
  validateMaskPlaceholder(props);
  var maskUtils = new MaskUtils({
    mask: mask,
    maskPlaceholder: maskPlaceholder
  });
  var isMasked = !!mask;
  var isEditable = !restProps.disabled && !restProps.readOnly;
  var isControlled = props.value !== null && props.value !== undefined;
  var previousIsMasked = usePrevious(isMasked);
  var initialValue = toString((isControlled ? props.value : props.defaultValue) || "");

  var _useInputState = useInputState(initialValue, isMasked),
      inputRef = _useInputState.inputRef,
      getInputState = _useInputState.getInputState,
      setInputState = _useInputState.setInputState,
      getLastInputState = _useInputState.getLastInputState;

  var getInputElement = useInputElement(inputRef);

  function onChange(event) {
    var currentState = getInputState();
    var previousState = getLastInputState();
    var newInputState = maskUtils.processChange(currentState, previousState);

    if (beforeMaskedStateChange) {
      newInputState = beforeMaskedStateChange({
        currentState: currentState,
        previousState: previousState,
        nextState: newInputState
      });
    }

    setInputState(newInputState);

    if (props.onChange) {
      props.onChange(event);
    }
  }

  function onFocus(event) {
    // If autoFocus property is set, focus event fires before the ref handler gets called
    inputRef.current = event.target;
    var currentValue = getInputState().value;

    if (isMasked && !maskUtils.isValueFilled(currentValue)) {
      var newValue = maskUtils.formatValue(currentValue);
      var newSelection = maskUtils.getDefaultSelectionForValue(newValue);
      var newInputState = {
        value: newValue,
        selection: newSelection
      };

      if (beforeMaskedStateChange) {
        newInputState = beforeMaskedStateChange({
          currentState: getInputState(),
          nextState: newInputState
        });
        newValue = newInputState.value;
        newSelection = newInputState.selection;
      }

      setInputState(newInputState);

      if (newValue !== currentValue && props.onChange) {
        props.onChange(event);
      } // Chrome resets selection after focus event,
      // so we want to restore it later


      defer(function () {
        setInputState(getLastInputState());
      });
    }

    if (props.onFocus) {
      props.onFocus(event);
    }
  }

  function onBlur(event) {
    var currentValue = getInputState().value;
    var lastValue = getLastInputState().value;

    if (isMasked && !alwaysShowMask && maskUtils.isValueEmpty(lastValue)) {
      var newValue = "";
      var newInputState = {
        value: newValue,
        selection: {
          start: null,
          end: null
        }
      };

      if (beforeMaskedStateChange) {
        newInputState = beforeMaskedStateChange({
          currentState: getInputState(),
          nextState: newInputState
        });
        newValue = newInputState.value;
      }

      setInputState(newInputState);

      if (newValue !== currentValue && props.onChange) {
        props.onChange(event);
      }
    }

    if (props.onBlur) {
      props.onBlur(event);
    }
  } // Tiny unintentional mouse movements can break cursor
  // position on focus, so we have to restore it in that case
  //
  // https://github.com/sanniassin/react-input-mask/issues/108


  function onMouseDown(event) {
    var input = getInputElement();

    var _getInputState = getInputState(),
        value = _getInputState.value;

    var inputDocument = getElementDocument(input);

    if (!isInputFocused(input) && !maskUtils.isValueFilled(value)) {
      var mouseDownX = event.clientX;
      var mouseDownY = event.clientY;
      var mouseDownTime = new Date().getTime();

      var mouseUpHandler = function mouseUpHandler(mouseUpEvent) {
        inputDocument.removeEventListener("mouseup", mouseUpHandler);

        if (!isInputFocused(input)) {
          return;
        }

        var deltaX = Math.abs(mouseUpEvent.clientX - mouseDownX);
        var deltaY = Math.abs(mouseUpEvent.clientY - mouseDownY);
        var axisDelta = Math.max(deltaX, deltaY);
        var timeDelta = new Date().getTime() - mouseDownTime;

        if (axisDelta <= 10 && timeDelta <= 200 || axisDelta <= 5 && timeDelta <= 300) {
          var _lastState = getLastInputState();

          var newSelection = maskUtils.getDefaultSelectionForValue(_lastState.value);

          var newState = _extends({}, _lastState, {
            selection: newSelection
          });

          setInputState(newState);
        }
      };

      inputDocument.addEventListener("mouseup", mouseUpHandler);
    }

    if (props.onMouseDown) {
      props.onMouseDown(event);
    }
  } // For controlled inputs we want to provide properly formatted
  // value prop


  if (isMasked && isControlled) {
    var input = getInputElement();
    var isFocused = input && isInputFocused(input);
    var newValue = isFocused || alwaysShowMask || props.value ? maskUtils.formatValue(props.value) : props.value;

    if (beforeMaskedStateChange) {
      newValue = beforeMaskedStateChange({
        nextState: {
          value: newValue,
          selection: {
            start: null,
            end: null
          }
        }
      }).value;
    }

    setInputState(_extends({}, getLastInputState(), {
      value: newValue
    }));
  }

  var lastState = getLastInputState();
  var lastSelection = lastState.selection;
  var lastValue = lastState.value;
  React.useLayoutEffect(function () {
    if (!isMasked) {
      return;
    }

    var input = getInputElement();
    var isFocused = isInputFocused(input);
    var previousSelection = lastSelection;
    var currentState = getInputState();

    var newInputState = _extends({}, currentState); // Update value for uncontrolled inputs to make sure
    // it's always in sync with mask props


    if (!isControlled) {
      var currentValue = currentState.value;
      var formattedValue = maskUtils.formatValue(currentValue);
      var isValueEmpty = maskUtils.isValueEmpty(formattedValue);
      var shouldFormatValue = !isValueEmpty || isFocused || alwaysShowMask;

      if (shouldFormatValue) {
        newInputState.value = formattedValue;
      } else if (isValueEmpty && !isFocused) {
        newInputState.value = "";
      }
    }

    if (isFocused && !previousIsMasked) {
      // Adjust selection if input got masked while being focused
      newInputState.selection = maskUtils.getDefaultSelectionForValue(newInputState.value);
    } else if (isControlled && isFocused && previousSelection) {
      // Restore cursor position if value has changed outside change event
      if (previousSelection.start !== null && previousSelection.end !== null) {
        newInputState.selection = previousSelection;
      }
    }

    if (beforeMaskedStateChange) {
      newInputState = beforeMaskedStateChange({
        currentState: currentState,
        nextState: newInputState
      });
    }

    setInputState(newInputState);
  });

  var inputProps = _extends({}, restProps, {
    onFocus: onFocus,
    onBlur: onBlur,
    onChange: isMasked && isEditable ? onChange : props.onChange,
    onMouseDown: isMasked && isEditable ? onMouseDown : props.onMouseDown,
    ref: function ref(_ref) {
      inputRef.current = _ref;

      if (isFunction(forwardedRef)) {
        forwardedRef(_ref);
      } else if (forwardedRef !== null && typeof forwardedRef === "object") {
        forwardedRef.current = _ref;
      }
    },
    value: isMasked && isControlled ? lastValue : props.value
  });

  if (children) {
    validateChildren(props, children); // We wrap children into a class component to be able to find
    // their input element using findDOMNode

    return /*#__PURE__*/React__default["default"].createElement(InputMaskChildrenWrapper, inputProps, children);
  }

  return /*#__PURE__*/React__default["default"].createElement("input", inputProps);
});
InputMask.displayName = "InputMask";
InputMask.defaultProps = {
  alwaysShowMask: false,
  maskPlaceholder: "_"
};
InputMask.propTypes = {
  alwaysShowMask: PropTypes__default["default"].bool,
  beforeMaskedStateChange: PropTypes__default["default"].func,
  children: PropTypes__default["default"].element,
  mask: PropTypes__default["default"].oneOfType([PropTypes__default["default"].string, PropTypes__default["default"].arrayOf(PropTypes__default["default"].oneOfType([PropTypes__default["default"].string, PropTypes__default["default"].instanceOf(RegExp)]))]),
  maskPlaceholder: PropTypes__default["default"].string,
  onFocus: PropTypes__default["default"].func,
  onBlur: PropTypes__default["default"].func,
  onChange: PropTypes__default["default"].func,
  onMouseDown: PropTypes__default["default"].func
};

module.exports = InputMask;
