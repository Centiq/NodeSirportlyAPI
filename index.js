/**
 * Sirportly V2 API for NodeJS.
 *
 * @category	sirportly
 * @package 	api
 * @author		Robert Pitt <rpitt@centiq.co.uk>
 * @copyright 	GPL V2
 * @version		1.0.1
 * @link	 	https://centiq.co.uk/
 */

/**
 * Require Dependancies
 */
var request	= require("request"),
	util 	= require("util"),
	debug 	= require("debug")("sirportly:api"),
	merge 	= require("merge");

/**
 * Sirportly API Class
 */
function SirportlyAPI(config) {
	/**
	 * Default configuration
	 * @type {Object}
	 */
	var _default_config = {
		/**
		 * Token used for requests
		 * @type {String}
		 */
		token : null,

		/**
		 * Secret used with the token for authorization
		 * @type {String}
		 */
		secret : null,

		/**
		 * Target server
		 * @type {String}
		 */
		server : null,

		/**
		 * protocol used for requests
		 * @type {String}
		 */
		protocol : 'http',

		/**
		 * Port that sirportly is running on.
		 * @type {Number}
		 */
		port : 80
	};
	
	/**
	 * merge the configuration
	 */
	this._config = merge(_default_config, config || {});

	/**
	 * Validate the required parameters.
	 */
	if(!this._config.token || !this._config.secret || !this._config.server)
	{
		throw new Error("Misconfiguration, token, secret and server required in the config.");
	}

	debug("Initialized with [%s]", this._config.server);
}

/**
 * make a request to the API
 * @param  {String}   uri      Path for the request
 * @param  {Object}   options  Request parameters, see @request
 * @param  {Function} callback Callback
 */
SirportlyAPI.prototype.request = function(uri, options, callback) {
	if(!callback || typeof callback != "function")
		throw new Error("Callback parameter must be a fuction");
	/**
	 * Server endpoint for this request
	 * @type {String}
	 */
	var endpoint = this._config.protocol + "://" + this._config.server + ":" + this._config.port + uri;

	/**
	 * Default request options
	 * @type {Object}
	 */
	var options = merge({
		method	: 'GET',
		url 	: endpoint,
		headers : {
			"X-Auth-Token":  this._config.token,
			"X-Auth-Secret": this._config.secret
		}
	}, options);


	/**
	 * Make the request
	 * @param  {Object|null} 	error    Error from Request library
	 * @param  {Response} 		response Response object from request library
	 * @param  {String} 		body     String representation of the repsonse body
	 */
	request(options, function(error, response, body){
		/**
		 * Check for request error
		 */
		if(error) return callback(error);

		/**
		 * Small debug notice about the response.
		 */
		debug("Request to [%d] -> [%s]", response.statusCode, uri);
		
		/**
		 * Decode the JSON Body
		 * @type {Object}
		 */
		var body_json = JSON.parse(body);

		/**
		 * Check for response code
		 */
		if(response.statusCode > 299 || response.statusCode < 200) {
			/**
			 * Single error response
			 */
			if(body_json.error)
				return callback(new Error(body_json.error));

			/**
			 * Multiple error resposnse, encode and represent as a string
			 */
			if(body_json.errors)
				return callback(new Error(body, response.statusCode, body));
		}

		/**
		 * Successfull call
		 */
		callback(null, body_json);
	})
};

/**
 * Fetch the configuration object for this instance
 * @return {Object} Configuration object
 */
SirportlyAPI.prototype.getConfig = function() {
	return this._config;
};

/**
 * Fetch a specific ticket object
 * @param  {String}   ticket_reference Ticket Reference ID
 * @param  {Function} callback         Callback
 * @see http://sirportly.com/docs/api-specification/tickets/getting-all-ticket-properties
 */
SirportlyAPI.prototype.ticket = function(ticket_reference, callback) {
	this.request('/api/v2/tickets/ticket', {qs: {reference: ticket_reference}}, callback);
}

/**
 * Fetch a list of tickets
 * @param  {Number|Function}   page     Page or callback, page wil default to 1 if not present
 * @param  {Function} callback Callback
 * @todo Implement sort_by and order
 * @see http://sirportly.com/docs/api-specification/tickets/listing-all-tickets
 */
SirportlyAPI.prototype.tickets = function(page, callback) {
	if(typeof page == 'function'){ page = 1; callback = page;};
	this.request('/api/v2/tickets/all', {qs: {page: (page || 1)}}, callback);
}

/**
 * Create a new Ticket
 * @param  {Object}   params   Ticket Parameters
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/tickets/submitting-a-new-ticket
 */
SirportlyAPI.prototype.submit_ticket = function(params, callback) {
	this.request('/api/v2/tickets/submit',{method: "POST", qs : params || {}}, callback);
}

/**
 * Post an update to a ticket
 * @param  {String}   reference Ticket Reference
 * @param  {Object}   updates   Updates
 * @param  {Function} callback  Callback
 * @see http://sirportly.com/docs/api-specification/tickets/posting-an-update
 */
SirportlyAPI.prototype.post_update = function(reference, updates, callback) {
	this.request('/api/v2/tickets/post_update', merge({form: updates}, {method: "POST", qs: {ticket: reference}}) , callback);
}

/**
 * Update a tickets properties
 * @param  {String}   reference Ticekt Reference
 * @param  {Object}   updates   Updates for the ticket
 * @param  {Function} callback  Callback
 * @see http://sirportly.com/docs/api-specification/tickets/changing-ticket-properties
 */
SirportlyAPI.prototype.update_ticket = function(reference, updates, callback) {
	this.request('/api/v2/tickets/update', merge({form: updates}, {method: "POST", qs: {ticket: reference}}) , callback);
}

/**
 * Execute a macro
 * @param  {String}   		reference   Ticket Reference
 * @param  {String|Number}  macro    Macro name or id
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/tickets/execute-a-macro
 */
SirportlyAPI.prototype.run_macro = function(reference, macro, callback) {
	this.request('/api/v2/tickets/macro', {qs: {ticket: reference, macro: macro}}, callback);
}

/**
 * Add afollow up to a ticket
 * @param {String}   reference   Ticket Reference
 * @param {Object}   params   	 parameters for the request
 * @param {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/tickets/add-a-follow-up
 */
SirportlyAPI.prototype.add_follow_up = function(reference, updates, callback) {
	this.request('/api/v2/tickets/add_followup', merge({form: updates}, {method: "POST", qs: {ticket: reference}}) , callback);
}

/**
 * Request Statuses
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/objects/statuses
 */
SirportlyAPI.prototype.statuses = function(callback) {
	this.request('/api/v2/objects/statuses', {}, callback);
}

/**
 * Request Priorities
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/objects/priorities
 */
SirportlyAPI.prototype.priorities = function(callback) {
	this.request('/api/v2/objects/priorities', {}, callback);
}

/**
 * Request Teams
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/objects/teams
 */
SirportlyAPI.prototype.teams = function(callback) {
	this.request('/api/v2/objects/teams', {}, callback);
}

/**
 * Request Brands
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/objects/brands
 */
SirportlyAPI.prototype.brands = function(callback) {
	this.request('/api/v2/objects/brands', {}, callback);
}

/**
 * Request Departments
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/objects/departments
 */
SirportlyAPI.prototype.departments = function(callback) {
	this.request('/api/v2/objects/departments', {}, callback);
}

/**
 * Request Escalation Paths
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/objects/escalation-paths
 */
SirportlyAPI.prototype.escalation_paths = function(callback) {
	this.request('/api/v2/objects/escalation_paths', {}, callback);
}

/**
 * Request SLA's
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/objects/slas
 */
SirportlyAPI.prototype.slas = function(callback) {
	this.request('/api/v2/objects/slas', {}, callback);
}

/**
 * Request Filters
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/objects/filters
 */
SirportlyAPI.prototype.filters = function(callback) {
	this.request('/api/v2/objects/filters', {}, callback);
}

/**
 * Create a new user
 * @param  {String}   email    Email Address
 * @param  {String}   first    Firstname
 * @param  {String}   last     Lastname
 * @param  {Object}   params   Other properties for the user
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/users/create-new-user
 */
SirportlyAPI.prototype.create_user = function(email, first, last, params, callback) {
	this.request('/api/v2/users/create',{method: "POST", qs: merge({email_address: email, first_name: first, last_name: last}, params)}, callback);
}

/**
 * Execute a SPQL Query.
 * @param  {String}   query    Query to execute
 * @param  {Function} callback Callback
 * @see http://sirportly.com/docs/api-specification/tickets/run-spql-query
 */
SirportlyAPI.prototype.spql = function(query, callback) {
	this.request('/api/v2/tickets/spql', {method: "POST", form: {spql: query}}, callback);
}

/**
 * Export the sirportly apiobject
 * @type {SirportlyAPI}
 */
module.exports = SirportlyAPI;