import React from "react";
import ReactSelect from "react-select";
import PropTypes from "prop-types";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import { Input, MenuItem } from "@material-ui/core";

const ITEM_HEIGHT = 48;

const customStyles = {
  control: () => ({
    display: "flex",
    alignItems: "center",
    border: 0,
    height: "auto",
    background: "transparent",
    "&:hover": {
      boxShadow: "none"
    }
  }),
  menu: () => ({
    backgroundColor: "white",
    boxShadow: "1px 2px 6px #888888", // should be changed as material-ui
    position: "absolute",
    left: 0,
    top: `calc(100% + 1px)`,
    width: "100%",
    zIndex: 2,
    maxHeight: ITEM_HEIGHT * 4.5
  }),
  menuList: () => ({
    maxHeight: ITEM_HEIGHT * 4.5,
    overflowY: "auto"
  })
};

const Option = (props) => {
  const { innerProps, children, isFocused, isSelected, onFocus, data } = props;
  return (
    <MenuItem
      // ref={innerRef}
      // {...innerProps}
      disabled={data.disabled}
      onFocus={onFocus}
      selected={isFocused}
      onClick={innerProps.onClick}
      // component={React.createElement('div', innerProps)}
      component="div"
      style={{
        fontWeight: isSelected ? 500 : 400
      }}
    >
      {children}
    </MenuItem>
  );
}

const DropdownIndicator = () => {
  return <ArrowDropDownIcon />
}

const SelectWrapped = (props) => {
  return (
    <ReactSelect
      components={{
        Option,
        DropdownIndicator,
      }}
      styles={customStyles}
      {...props}
    />
  );
};

class AutoSelect extends React.Component {

  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  handleChange = (data) => {
    // data is the selected item of the options array, with a value and label field.
    const target = {
      ...this.inputRef.current.props,
      ...data, // Override value from data
    };

    if (this.props.onChange) {
      this.props.onChange({ ...data, target });
    }
  }

  render() {
    const { options, value, input, onInputChange } = this.props;
    
    const labelItem = options.find(d => d.value === value);
    const label = labelItem === undefined ? value : labelItem.label;

    const createInput = (props) => input ?
      React.cloneElement(input, props) :
      React.createElement(Input, props);

    return createInput({
      ref: this.inputRef,
      fullWidth: true,
      inputComponent: SelectWrapped,
      value,
      onChange: this.handleChange,
      placeholder: this.props.placeholder,
      inputProps: {
        options,
        value: { value, label },
        onInputChange
      }
    });
  }
}

AutoSelect.propTypes = {
  options: PropTypes.array.isRequired,
  // value: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  placeholder: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  input: PropTypes.element,
};

AutoSelect.defaultProps = {
  placeholder: 'Select...',
};

// export default withStyles(styles, { withTheme: true })(AutoSelect);
export default AutoSelect;
