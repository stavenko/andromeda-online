window.World.addUniformUpdater = function(name, updfunc){
    this._uniform_updaters[name] = updfunc;
}
window.World.removeUniformUpdater = function(name){
    delete this._uniform_updaters[name];
}

