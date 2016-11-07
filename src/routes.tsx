import * as React from 'react';
import {Route, IndexRedirect} from 'react-router';
import {App} from './App';
import {Main, onEnter as MainOnEnter} from './modules/Main';
import Dashboard, {onEnter as DashboardOnEnter } from './modules/dashboard/components/Dashboard';
import DashboardHeader from './modules/dashboard/components/DashboardHeader';
import { SimpleColors } from './modules/visualiser3D/components/simpleColors/SimpleColors';
import { Lighting } from './modules/visualiser3D/components/lighting/Lighting';
import { Intro } from './modules/visualiser3D/components/intro/Intro';
import { ComplexGraphics } from './modules/visualiser3D/components/ComplexGraphics/complexGraphics';

const routes = (store) => {
  return (
    <Route path="/" component={App}>
      <IndexRedirect to="visualiser/intro"/>
      <Route component={Main} onEnter={(next, replace, cb) => { MainOnEnter(store, next, replace, cb); }}>
        <Route path="visualiser"
          components={{stage: Dashboard, stageHeader: DashboardHeader}}
          onEnter={(next, replace, cb) => { DashboardOnEnter(store, next, replace, cb); }}>
            <Route path="intro" components={{mainComponent:Intro}} ></Route>
            <Route path="complexGraphics" components={{mainComponent:ComplexGraphics}} ></Route>
            <Route path="simpleColors" components={{mainComponent:SimpleColors}} ></Route>
            <Route path="lighting" components={{mainComponent:Lighting}} ></Route>
        </Route>
      </Route>
    </Route>
  );
};

export default routes;
