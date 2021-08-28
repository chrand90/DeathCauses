import React from 'react';
import { Container } from 'react-bootstrap';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link, NavLink } from 'react-router-dom';
import './NavBar.css';

interface NavigationProp { fullWidth: boolean }

export default class Navigation extends React.Component<NavigationProp> {
    render() {
        let element = this.props.fullWidth ? this.renderNavigationBar() : <Container className="pr-0 pl-0">{this.renderNavigationBar()}</Container>

        return (
            element
        )
    }

    renderNavigationBar() {
        return (
            <Navbar className="bg-dark navbar-dark pb-3 pt-3 rounded-corners" expand="lg">
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Brand as={Link} to="/">Death Causes</Navbar.Brand>
                <Navbar.Collapse id="responsive-navbar-nav" className="" >
                    <Nav className="ml-auto" variant="pills" >
                        <Nav.Item className="px-2">
                            <NavLink to="/model" className="nav-link" id="nav-link-header" activeClassName="nav-link active">About the Model</NavLink>
                        </Nav.Item>
                        <Nav.Item className="px-2">
                            <NavLink to="/contact" className="nav-link" id="nav-link-header" activeClassName="nav-link active">Contact</NavLink>
                        </Nav.Item>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        )
    }
}