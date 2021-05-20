import React from "react";
import {makeObservable, observable, computed, action} from "mobx";

export default class RootStore {
  color: string;
    constructor(){
      this.color="#1455fa"
      makeObservable(this, {
        color: observable,
        setColor:action,
      })

    }

    setColor(newCol: string){
      this.color=newCol
    }
}

/* Store end */

/* Store helpers */
export const StoreContext = React.createContext<RootStore| null>(null);

/* Hook to use store in any functional component */
export const useStore = () => React.useContext(StoreContext);
 
/* HOC to inject store to any functional or class component */
export const withStore = (Component:any) => (props:any) => {
  return <Component {...props} store={useStore()} />;
};