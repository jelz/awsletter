window.AWSLETTER.factory('LocalStore', function() {

    var STORAGE = window.localStorage;
    var CACHE = {};

    return {
        getStorage: function() { return STORAGE; },
        create: createCached,
        getInstance: createCached
    };

    function createCached(prefix) {
        if (!CACHE[prefix]) {
            CACHE[prefix] = createStore(function(key) {
                return prefix + '.' + key;
            });
        }

        return CACHE[prefix];
    }

    function createStore(p) {
        return {
            save: save(p),
            has: has(p),
            read: read(p),
            remove: remove(p)
        };
    }

    function save(prefixed) {
        return function(key, value) {
            STORAGE.setItem(prefixed(key), JSON.stringify(value));
        };
    }

    function has(prefixed) {
        return function(key) {
            return !!(read(prefixed)(key));
        }
    }

    function read(prefixed) {
        return function(key) {
            return JSON.parse(STORAGE.getItem(prefixed(key)) || 'null');
        }
    }

    function remove(prefixed) {
        return function(key) {
            STORAGE.removeItem(prefixed(key));
        }
    }
});
