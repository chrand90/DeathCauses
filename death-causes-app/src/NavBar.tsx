import React from 'react';
import { Container } from 'react-bootstrap';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link, NavLink } from 'react-router-dom';
import './NavBar.css';


export default class Navigation extends React.Component {
    render() {
        return (
            this.renderNavigationBar()
        )
    }

    renderNavigationBar() {
        return (
            <Navbar className="bg-dark sticky-top navbar-dark pr-5 pl-5 pb-3 pt-3 rounded-corners" expand="lg">
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Brand as={Link} to="/">Death Causes</Navbar.Brand>
                <Navbar.Collapse id="responsive-navbar-nav" className="" >
                    <Nav className="ml-auto" variant="pills" >
                        <Nav.Item className="px-2">
                            <NavLink to="/model" className="nav-link" activeClassName="nav-link active">About the Model</NavLink>
                        </Nav.Item>
                        <Nav.Item className="px-2">
                            <NavLink to="/contact" className="nav-link" activeClassName="nav-link active">Contact</NavLink>
                        </Nav.Item>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        )
    }
}