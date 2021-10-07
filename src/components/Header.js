import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MenuIcon from "@material-ui/icons/Menu";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import Divider from "@material-ui/core/Divider";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import InfoIcon from "@material-ui/icons/InfoOutlined";
import TutorialsIcon from "@material-ui/icons/VideoLibraryOutlined";
import TeamIcon from "@material-ui/icons/PeopleOutlined";
import AwardsIcon from "@material-ui/icons/EmojiEventsOutlined";
import CiteIcon from "@material-ui/icons/DescriptionOutlined";
import IconGithub from "./Github";

import useMediaQuery from "@material-ui/core/useMediaQuery";
import BioDemText from "./BioDemText";
import BioDemLogo from "./BioDemLogo";

const useStyles = makeStyles({
  button: {
    textTransform: "none",
  },
});

const Header = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const classes = useStyles();

  /* Creating a function to handle manu: */
  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    {
      label: "About",
      href: "#about",
      icon: <InfoIcon />,
    },
    {
      label: "Tutorials",
      href: "#tutorials",
      icon: <TutorialsIcon />,
    },
    {
      label: "Team",
      href: "#team",
      icon: <TeamIcon />,
    },
    {
      label: "Awards",
      href: "#awards",
      icon: <AwardsIcon />,
    },
    {
      label: "How to cite",
      href: "#cite",
      icon: <CiteIcon />,
    },
  ];

  return (
    <AppBar color="primary" position="fixed" className="appbar">
      <Toolbar variant="dense">
        {isMobile ? (
          <React.Fragment>
            <IconButton onClick={toggleDrawer}>
              <MenuIcon style={{ color: "white" }} />
            </IconButton>
            <BioDemText />
            <Drawer anchor="left" open={isOpen} onClose={toggleDrawer}>
              <List>
                <ListItem component="a" href="#top" onClick={toggleDrawer}>
                  <ListItemIcon>
                    <BioDemLogo className="appbar-logo" alt="appbar-logo" />
                  </ListItemIcon>
                  <ListItemText>
                    <BioDemText />
                  </ListItemText>
                </ListItem>
                <ListItem style={{ marginTop: -25, marginBottom: -10 }}>
                  <ListItemText>
                    <span style={{ fontSize: 12, color: "#999999" }}>
                      <span>Version: </span>
                      <span>{`${process.env.REACT_APP_VERSION}`}</span>
                    </span>
                  </ListItemText>
                </ListItem>
              </List>
              <Divider />
              <List>
                {menuItems.map(({ label, href, icon }) => (
                  <ListItem
                    component="a"
                    key={href}
                    href={href}
                    onClick={toggleDrawer}
                  >
                    <ListItemIcon>{icon}</ListItemIcon>
                    <ListItemText primary={label} />
                  </ListItem>
                ))}
              </List>
              <Divider />
              <List>
                <ListItem
                  component="a"
                  href="https://github.com/AntonelliLab/Bio-Dem"
                >
                  <ListItemIcon>
                    <IconGithub />
                  </ListItemIcon>
                  <ListItemText>Source code</ListItemText>
                </ListItem>
              </List>
            </Drawer>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Button
              href="#top"
              color="inherit"
              classes={{ root: classes.button }}
              aria-label="Home"
              style={{ paddingTop: 0, paddingBottom: 0 }}
              startIcon={
                <BioDemLogo className="appbar-logo" alt="appbar-logo" />
              }
            >
              <BioDemText />
            </Button>
            {menuItems.map(({ label, href, icon }) => (
              <Button
                key={href}
                href={href}
                color="inherit"
                startIcon={icon}
                style={{ marginLeft: 20 }}
              >
                {label}
              </Button>
            ))}
            <span style={{ flexGrow: 1 }} />
            <span>{`${process.env.REACT_APP_VERSION}`}</span>
            <IconButton
              href="https://github.com/AntonelliLab/Bio-Dem"
              color="inherit"
              aria-label="Github"
              style={{ padding: 8 }}
            >
              <IconGithub />
            </IconButton>
          </React.Fragment>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
