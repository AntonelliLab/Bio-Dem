import React, { useState } from "react";
import PropTypes from "prop-types";
// import deburr from 'lodash/deburr';
import Downshift from "downshift";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Paper from "@material-ui/core/Paper";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

function renderInput(inputProps) {
  const { InputProps, classes, ref, ...other } = inputProps;

  return (
    <TextField
      InputProps={{
        inputRef: ref,
        classes: {
          root: classes.inputRoot,
          input: classes.inputInput,
        },
        ...InputProps,
      }}
      {...other}
    />
  );
}

renderInput.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object.isRequired,
  InputProps: PropTypes.object,
};

function renderOption(optionProps) {
  const { option, index, itemProps, highlightedIndex, selectedItem } =
    optionProps;
  const isHighlighted = highlightedIndex === index;
  const isSelected = selectedItem && selectedItem.value === option.value;

  return (
    <MenuItem
      {...itemProps}
      key={option.value}
      selected={isHighlighted}
      component="div"
      style={{
        fontWeight: isSelected ? 700 : 400,
      }}
    >
      {option.label || option.value}
    </MenuItem>
  );
}

renderOption.propTypes = {
  highlightedIndex: PropTypes.oneOfType([
    PropTypes.oneOf([null]),
    PropTypes.number,
  ]).isRequired,
  index: PropTypes.number.isRequired,
  itemProps: PropTypes.object.isRequired,
  selectedItem: PropTypes.string.isRequired,
  option: PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string,
  }).isRequired,
};

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    position: "relative",
  },
  paper: {
    position: "absolute",
    zIndex: 1,
    marginTop: theme.spacing(1),
    left: 0,
    right: 0,
  },
  chip: {
    margin: theme.spacing(0.5, 0.25),
  },
  inputRoot: {
    flexWrap: "wrap",
  },
  inputInput: {
    width: "auto",
    flexGrow: 1,
  },
  divider: {
    height: theme.spacing(2),
  },
}));

// const itemToString = ({ value, label } = {}) => label || value || '';
const itemToString = (item) => (item ? item.label || item.value || "" : "");
const getSelectedOption = (options, value) =>
  options.find((option) => option.value === value);

export default function AutoSelect(props) {
  const classes = useStyles();

  const [inputValue, setInputValue] = useState(props.value);

  const { value, options, name, label } = props;
  const selectedOption = getSelectedOption(options, value);
  const isControlled = value !== undefined;

  function getOptions(value, { showEmpty = false } = {}) {
    return options;
    // const inputValue = deburr(value.trim()).toLowerCase();
    // const inputLength = inputValue.length;
    // let count = 0;

    // return inputLength === 0 && !showEmpty
    //   ? []
    //   : options.filter(option => {
    //       const keep =
    //         count < 5 && option.label.slice(0, inputLength).toLowerCase() === inputValue;

    //       if (keep) {
    //         count += 1;
    //       }

    //       return keep;
    //     });
  }

  const getChangeEvent = (newValue) => ({
    target: {
      name,
      value: newValue,
    },
  });

  const onChange = (item) => {
    if (!item && !props.allowNoSelection) {
      return;
    }
    props.onChange(getChangeEvent(item ? item.value : ""));
  };

  // const onStateChange = (data) => {
  //   if (data.type === Downshift.stateChangeTypes.changeInput) {
  //     setInputValue(data.inputValue);
  //   }
  //   if (data.type === Downshift.stateChangeTypes.keyDownEnter) {
  //     props.onChange(getChangeEvent(''));
  //   }
  // }

  const onInputValueChange = (newInputValue) => {
    if (isControlled) {
      setInputValue(newInputValue);
    }
    if (props.onInputChange) {
      props.onInputChange(newInputValue);
    }
  };

  return (
    <div className={classes.root}>
      <Downshift
        id={name}
        inputValue={inputValue}
        selectedItem={selectedOption}
        onChange={onChange}
        // onStateChange={onStateChange}
        onInputValueChange={onInputValueChange}
        itemToString={itemToString}
      >
        {({
          getInputProps,
          getItemProps,
          getLabelProps,
          getMenuProps,
          highlightedIndex,
          inputValue,
          isOpen,
          selectedItem,
          selectItem,
          openMenu,
          closeMenu,
        }) => {
          const { onBlur, onFocus, ...inputProps } = getInputProps({
            placeholder: props.placeholder,
            onFocus: openMenu,
            onClick: openMenu,
            onKeyDown: (event) => {
              if (
                event.key === "Enter" &&
                props.allowNoSelection &&
                !inputValue
              ) {
                selectItem({});
                closeMenu();
              }
            },
          });

          const isMatch =
            selectedOption &&
            (inputValue === selectedOption.value ||
              inputValue === selectedOption.label);
          const displayValue = isMatch
            ? itemToString(selectedItem)
            : inputValue;
          // console.log(`!!! renderInput with inputProps.value: '${inputProps.value}',
          // selectedOption: ${JSON.stringify(selectedOption)}, selectedItem: ${JSON.stringify(selectedItem)},
          //  inputValue: '${inputValue}', isMatch? ${isMatch}, isOpen? ${isOpen}, ==> value: '${displayValue}'`);

          return (
            <div className={classes.container}>
              {renderInput({
                fullWidth: true,
                classes,
                label,
                InputLabelProps: getLabelProps({ shrink: true, htmlFor: name }),
                InputProps: { onBlur, onFocus },
                name,
                ...inputProps,
                value: displayValue,
              })}

              <div {...getMenuProps()}>
                {isOpen ? (
                  <Paper className={classes.paper} square>
                    {getOptions(inputValue).map((option, index) =>
                      renderOption({
                        option,
                        index,
                        itemProps: getItemProps({ item: option }),
                        highlightedIndex,
                        selectedItem: selectedOption,
                      }),
                    )}
                  </Paper>
                ) : null}
              </div>
            </div>
          );
        }}
      </Downshift>
    </div>
  );
}

AutoSelect.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onInputChange: PropTypes.func,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isClearable: PropTypes.bool,
  allowNoSelection: PropTypes.bool,
};

AutoSelect.defaultProps = {
  label: "",
  placeholder: "Select...",
  isClearable: false,
};

export const MuiSelect = ({
  options,
  value,
  onChange,
  input,
  label = (d) => d.label,
}) => (
  <Select
    value={options.length === 0 ? "" : value}
    onChange={onChange}
    input={input}
  >
    {options.map((o) => (
      <MenuItem key={o.value} value={o.value}>
        {label(o)}
      </MenuItem>
    ))}
  </Select>
);
