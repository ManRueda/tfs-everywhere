import {Workspace} from './Workspace';

var dada = new Workspace("https://manrueda.visualstudio.com/DefaultCollection", "****", "*****");

dada.listLocalWorkspaces().then((dada) => {
    console.log(dada);
});