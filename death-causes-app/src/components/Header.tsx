import React from 'react';
import './Header.css';

class Header extends React.PureComponent {

    render(): React.ReactNode {
        return (<div className='header'> 
            <h1> Death Causes</h1>
        </div>);
    };
}

export default Header;