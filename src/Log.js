CONFIG = window.CONFIG || {};

Ext.define('Log', {
    singleton: true,
    // Default Settings. Change in app.json file.
    // 
    settings: (CONFIG && CONFIG.SETTINGS) || {
        // disable all logging
        enabled: true,

        // Granular disable of logging.
        log_info: true,
        log_debug: true,
        log_errors: true,
        log_warnings: true,
        log_json: true,
        log_values: true,
        log_events: true,
        log_viewmodels: true,
        log_method_names: true,
        log_method_params: true,
        log_method_params_value: true,

        // Disable logs for specific classes.
        disabled: [
            // 'Pnm.view.main.Main',
        ]
    },

    info(msg) {
        if (!this.settings.enabled || !this.settings.log_info) return;

        var type = '@INFO';
        var css = 'font-weight: 600; color: skyblue; ';

        console.info(`%c${type}:\t ${msg}`, `${css}`);
    },

    warn(msg, options) {
        // if (!this.settings.enabled || !this.settings.log_warnings) return;

        var type = '@WARN';
        var css  = 'font-weight: 600; color: orange;';
        var argsLength = arguments.length;
        var arg1IsString = (this.getType(arguments[0]) === 'String');
        var arg1IsObject = (this.getType(arguments[0]) === 'Object');
        var arg2IsObject = (this.getType(arguments[1]) === 'Object');
        var defaultOptions = { scope: null, args: null, when: false, values: null, msg: null, message: null };
        
        options = options || {};

        if (argsLength == 1 && arg1IsObject) {
            options = Object.assign(defaultOptions, arguments[0]);
        }
        else if (arg1IsString && arg2IsObject) {
            msg = arguments[0];
            options = Object.assign(defaultOptions, arguments[1]);
        }

        var classpath = (options.scope && options.args) ? this.getClassPath(options.scope, options.args) : '';
        var message = msg || options.message || options.msg;

        console.warn(`%c@WARNING: ${message} ${classpath ? 'in ' : ' '}${classpath}`, `${css}`);
    },

    error(e, options) {
        if (!this.settings.enabled || !this.settings.log_errors) return e;
        
        options = options || { scope: null, args: [] };

        var css  = 'font-weight: 600; color: red;';
        var error = (typeof e === 'string') ? new Error(e) : e;
        var classpath = (options.scope && options.args) ? this.getClassPath(options.scope, options.args) : '';

        console.error(`%c@ERROR: ${error.message} ${classpath ? 'in ' : ' '}${classpath}`, `${css}`);

        // if (options.scope && options.args) this.method(options.scope, options.args);
        if (options.throws) throw error;

        return error;
    },

    debug() {
        if (!this.settings.enabled || !this.settings.log_debug) return;
        
        var type = '@DEBUG';
        var css = 'font-weight: 600; color: limegreen;';
        
        console.info(`%c${type}:\t`, `${css}`, ...arguments);
    },

    fire() {
        if (!this.settings.enabled || !this.settings.log_events) return;

        var type = '@FIRE';
        var css = 'font-weight: 600; color: orange;';

        console.log(`%c${type}:\t`, `${css}`, ...arguments);
    },

    on() {
        if (!this.settings.enabled || !this.settings.log_events) return;

        var type = '@ON';
        var css = 'font-weight: 600; color: pumpkin;';

        console.log(`%c${type}:\t`, `${css}`, ...arguments);
    },

    json(obj) {
        if (!this.settings.enabled || !this.settings.log_json) return;

        console.log('@JSON',  JSON.stringify(obj, null, 4));
    },

    banner(msg, char) {
        var border = new Array(msg.length + 2).fill(char || '-').join('');
        border = '\n' + border + '\n';
        
        console.log(border, msg, border + ' ');
    },

    method(scope, args) {
        if (!this.settings.enabled || !this.settings.log_method_names) return;

        var css = 'color: gray;';
        var classpath = this.getClassPath(scope, args);

        if (this.isLoggingDisabled(classpath)) return;

        if (args && args.length) {
            try {
                console.groupCollapsed(`%c${classpath}`, css);
                this.params(args);
                console.log(`%c@scope %c{${this.getType(scope)}}%c this`, 'color: lightgray;', 'color: cyan;', 'color: lightgray;', scope);
                console.groupEnd(`%c${classpath}`, css);
            } catch(e) {
                console.warn(arguments.callee.name, e.message);
            }
        } else {
            console.log(`%c${classpath}`, css);
        }
    },

    params(args) {
        if (!this.settings.enabled || !this.settings.log_method_params) return;

        var paramNames = /\((.*?)\)/gi.exec(args.callee.toString())[0].replace('(', '').replace(')', '').split(',');

        Array.from(args).forEach((arg, index) => {
            let type = this.getType(arg);
            let name = String(paramNames[index] || `arguments[${index}]`).trim();

            console.log(`%c@param %c{${type}}%c ${name}`, 'color: lightgray;', 'color: cyan;', 'color: lightgray;', (this.settings.log_method_params_value ? arg : ''));
        });
    },

    value(value, desc) {
        if (!this.settings.enabled || !this.settings.log_values) return value;
        
        console.log(`@value:\t%c{${this.getType(value)}} %c${(desc || '')}:`, 'color: cyan;', 'color: lightgray;', value);
        
        return value;
    },

    vm(selector, fields) {
        if (!this.settings.enabled || !this.settings.log_viewmodels) return;
        
        (selector && selector.hasVM ? [selector] : Ext.ComponentQuery.query((selector || '[hasVM=true]:not(gridrow)'))).forEach(view => {
            const className = this.getViewModelClassPath(view);
            const data = view.getViewModel().getData();

            let values = {};

            if (fields) {
                fields.forEach(field => values[field] = data[field]);
            } else {
                values = data;
            }

            console.log(`\nVIEWMODEL:\t${className}:`, values, '\n ');
        });
    },

    warnIf(condition, message) {
        if (!condition) {
            this.warn(message);
        }
    },

    isLoggingDisabled(classname) {
        return (this.settings.disabled.filter(classpath => (classname.startsWith(classpath))).length > 0);
    },
    
    getParams(args) {

        var names = /\((.*?)\)/gi.exec(args.callee.toString())[0].replace('(', '').replace(')', '').split(',');
        var params = Array.from(args).map((arg, index) => {
            let name = String(names[index] || index).trim();
            let type = this.getType(arg);
            let value = args[index];

            return { type, name, value };
        });
        Log.debug(args.callee.name);
        Log.json(params);
        return params;
    },

    getMethodName(args) {
        var paramNames = /\((.*?)\)/gi.exec(args.callee.toString())[0].replace('(', '').replace(')', '').split(',');
        console.log(args.callee.name);
        console.log(paramNames);
    },

    getClassPath(scope, args) {
        var className = scope.$className;
        if (scope.$className === 'Ext.app.ViewController') {
            className = `${scope.view.$className}.controller`;
        }
        return `${className}.${(args && args.callee.name || '<unknown_method>')}`;
    },

    getViewModelClassPath(view) {
        return view.viewModel.__proto__.$className === 'Ext.app.ViewModel'
            ? view.__proto__.$className
            : view.viewModel.__proto__.$className
        ;
    },

    getType(obj) {
        return (obj != null && obj != undefined && obj.constructor)
            ? (obj.constructor.name === 'constructor' && obj.__proto__.$className || obj.constructor.xtype || obj.constructor.name)
            : (obj && obj.constructor.name || typeof(obj))
        ;
    },

    getTypeMeta(obj) {
        const tag               = (obj && obj.toString && obj.toString() || obj);
        const primitive         = (obj != null && obj != undefined ? typeof(obj) : (obj == null ? 'null' : 'undefined'));
        const type              = (obj && obj.constructor.$className || obj && obj.constructor.name ) || (Object.prototype.toString.call(obj).toString().replace('[object ', '').replace(']', ''));
        const isUndefinedOrNull = (primitive == 'undefined' || primitive == 'null');
        
        // console.log('primitive', primitive, 'isUndefinedOrNull:', isUndefinedOrNull);
        
        return {
            tag,
            type,
            primitive,
            isUndefinedOrNull,
            value: obj,
            length: obj && obj.length,
            size: obj && obj.size
        };
    },

    getPrimitive(obj) {
        if (obj === null) return 'null';
        if (obj === undefined) return 'undefined';
        return Array.isArray(obj) ? 'array' : typeof(obj);
    },

    queryObject(obj, { results, path, value, property, depth }) {

        results = results || [];
        path  = path  || [];
        depth = depth || 1;

        const type = this.getPrimitive(obj);
        const array = Object.keys(type == 'array' || type == 'object' ? obj : {});

        // console.log(obj);

        for (let key of array) {

            const val = obj[key];
            const type = this.getPrimitive(val);

            console.log(key, val);
            
            if (type == 'array' || type == 'object') {
                console.log(val);

                results = this.queryObject(val, {
                    results,
                    value,
                    property,
                    path: path.concat(Ext.isNumber(key) ? `[${key}]` : `.${key}`),
                    depth: depth + 1
                });

            } else {
                if (property == key) {
                    // console.log('property == key', key);
                    // console.log('value', val);

                    path.push(key);

                    results.push({
                        depth,
                        key,
                        val,
                        path,
                        namespace: path.join('.')
                    });
                }
            }
        }
        console.log(results);
        return results;
    }
});

    // // Default Settings. Change in app.json file.
    // // 
    // settings: (CONFIG && CONFIG.SETTINGS) || {
    //     // disable all logging
    //     enabled: true,

    //     // Granular disable of logging.
    //     log_info: true,
    //     log_debug: true,
    //     log_errors: true,
    //     log_warnings: true,
    //     log_json: true,
    //     log_values: true,
    //     log_events: true,
    //     log_viewmodels: true,
    //     log_method_names: true,
    //     log_method_params: true,
    //     log_method_params_value: true,

    //     // Disable logs for specific classes.
    //     disabled: [
    //         // 'Pnm.view.main.Main',
    //     ]
    // },

    // info(msg) {
    //     if (!this.settings.enabled || !this.settings.log_info) return;

    //     var type = 'INFO';
    //     var css = 'font-weight: 600; color: skyblue; ';

    //     console.info(`%c${type}:\t${msg}`, `${css}`);
    // },

    // warn(msg, options) {
    //     if (!this.settings.enabled || !this.settings.log_warnings) return;

    //     var type = 'WARN';
    //     var css  = 'font-weight: 600; color: orange;';
        
    //     if (this.getType(msg) === 'string') {
    //         console.warn(`%c${type}:\t${msg}`, `${css}`, ...arguments);
    //         return;
    //     }

    //     var options = (options || this.getType(msg) === 'object' ? msg : {});
    //     var { scope, args, values } = options;
        
    //     var classpath = '';
    //     var message = options.message || options.msg;
        
    //     if (Ext.isEmpty(options) || Ext.isEmpty(options.when)) return;

    //     if (options.when === true) {
    //         classpath = (scope && args) ? this.getClassPath(scope, args) : '';
    //         console.warn(`\n%c WARN:\t${classpath}\n\t${message}`, `${css}`, values, '\n');
    //     }
    // },

    // error(e, options) {
    //     if (!this.settings.enabled || !this.settings.log_errors) return e;

    //     var error = (typeof e === 'string') ? new Error(e) : e;

    //     console.error(`@ERROR:\t${error.message}`, e.stack);

    //     if (options.scope && options.args) this.method(scope, args);
    //     if (options.throwsError) throw error;

    //     return e;
    // },

    // debug() {
    //     if (!this.settings.enabled || !this.settings.log_debug) return;
        
    //     var type = '@DEBUG';
    //     var css = 'font-weight: 600; color: limegreen;';
        
    //     console.info(`%c${type}:\t`, `${css}`, ...arguments);
    // },

    // fire() {
    //     if (!this.settings.enabled || !this.settings.log_events) return;

    //     var type = '@FIRE';
    //     var css = 'font-weight: 600; color: orange;';

    //     console.log(`%c${type}:\t`, `${css}`, ...arguments);
    // },

    // on() {
    //     if (!this.settings.enabled || !this.settings.log_events) return;

    //     var type = '@ON';
    //     var css = 'font-weight: 600; color: pumpkin;';

    //     console.log(`%c${type}:\t`, `${css}`, ...arguments);
    // },

    // json(obj) {
    //     if (!this.settings.enabled || !this.settings.log_json) return;

    //     console.log('@JSON', JSON.stringify(obj, null, 4));
    // },

    // method(scope, args) {
    //     if (!this.settings.enabled || !this.settings.log_method_names) return;

    //     var css = 'color: gray;';
    //     var classpath = this.getClassPath(scope, args);

    //     if (this.isLoggingDisabled(classpath)) return;

    //     if (args && args.length) {
    //         try {
    //             console.groupCollapsed(`%c${classpath}`, css);
    //             this.params(args);
    //             console.log(`%c@scope %c{${this.getType(scope)}}%c this`, 'color: lightgray;', 'color: cyan;', 'color: lightgray;', scope);
    //             console.groupEnd(`%c${classpath}`, css);
    //         } catch(e) {
    //             console.warn(arguments.callee.name, e.message);
    //         }
    //     } else {
    //         console.log(`%c${classpath}`, css);
    //     }
    // },

    // params(args) {
    //     if (!this.settings.enabled || !this.settings.log_method_params) return;

    //     var paramNames = /\((.*?)\)/gi.exec(args.callee.toString())[0].replace('(', '').replace(')', '').split(',');
        
    //     Array.from(args).forEach((arg, index) => {
    //         let type = this.getType(arg);
    //         let name = String(paramNames[index] || '').trim();

    //         console.log(`%c@param %c{${type}}%c ${name}`, 'color: lightgray;', 'color: cyan;', 'color: lightgray;', (this.settings.log_method_params_value ? arg : ''));
    //     });
    // },

    // value(value, desc) {
    //     if (!this.settings.enabled || !this.settings.log_values) return value;
        
    //     console.log(`@value:\t%c{${this.getType(value)}} %c${(desc || 'value')}:`, 'color: cyan;', 'color: lightgray;', value);
        
    //     return value;
    // },

    // vm(selector, fields) {
    //     if (!this.settings.enabled || !this.settings.log_viewmodels) return;
        
    //     (selector && selector.hasVM ? [selector] : Ext.ComponentQuery.query((selector || '[hasVM=true]:not(gridrow)'))).forEach(view => {
    //         const className = this.getViewModelClassPath(view);
    //         const data = view.getViewModel().getData();

    //         let values = {};

    //         if (fields) {
    //             fields.forEach(field => values[field] = data[field]);
    //         } else {
    //             values = data;
    //         }

    //         console.log(`\nVIEWMODEL:\t${className}:`, values, '\n ');
    //     });
    // },

    // warnIf(condition, message) {
    //     if (!condition) {
    //         Pnm.util.this.warn(message);
    //     }
    // },

    // isLoggingDisabled(classname) {
    //     return (this.settings.disabled.filter(classpath => (classname.startsWith(classpath))).length > 0);
    // },
    
    // getClassPath(scope, args) {
    //     var className = scope.$className;
    //     if (scope.$className === 'Ext.app.ViewController') {
    //         className = `${scope.view.$className}.controller`;
    //     }
    //     return `${className}.${(args && args.callee.name || '<unknown_method>')}`;
    // },

    // getViewModelClassPath(view) {
    //     return view.viewModel.__proto__.$className === 'Ext.app.ViewModel'
    //         ? view.__proto__.$className
    //         : view.viewModel.__proto__.$className
    //     ;
    // },

    // getType(obj) {
    //     return (obj != null && obj != undefined && obj.constructor)
    //         ? (obj.constructor.name === 'constructor' && obj.__proto__.$className || obj.constructor.xtype || obj.constructor.name)
    //         : (obj && obj.constructor.name || typeof(obj))
    //     ;
    // }
