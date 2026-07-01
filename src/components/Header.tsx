import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InfoIcon from "@mui/icons-material/InfoOutlined";
import TutorialsIcon from "@mui/icons-material/VideoLibraryOutlined";
import TeamIcon from "@mui/icons-material/PeopleOutlined";
import AwardsIcon from "@mui/icons-material/EmojiEventsOutlined";
import CiteIcon from "@mui/icons-material/DescriptionOutlined";
import IconGithub from "./Github";

import useMediaQuery from "@mui/material/useMediaQuery";
import BioDemText from "./BioDemText";
import BioDemLogo from "./BioDemLogo";

const Header = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));

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
                      <span>{`${__APP_VERSION__}`}</span>
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
              sx={{ textTransform: "none" }}
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
            <span>{`${__APP_VERSION__}`}</span>
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
