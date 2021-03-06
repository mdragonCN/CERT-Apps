Ember.RSVP.on('error', function(error) {
	console.error("RSVP error");
	Ember.Logger.assert(false, error);
});

window.CERTApps = Ember.Application.create(
	{
		// Basic logging, e.g. "Transitioned into 'post'"
		LOG_TRANSITIONS: true, 

		// Extremely detailed logging, highlighting every internal
		// step made while transitioning into a route, including
		// `beforeModel`, `model`, and `afterModel` hooks, and
		// information about redirects and aborted transitions
		LOG_TRANSITIONS_INTERNAL: true,
	
		LOG_VIEW_LOOKUPS: true,
		LOG_ACTIVE_GENERATION: true
	});

//Ember.LOG_BINDINGS = true;

CERTApps.BaseObject = CERTModels.BaseObject.extend();

CERTApps.Router.map(function() 
{
	this.route('landing', { path: 'landing' });
	this.resource('member', function() {	
		this.route("edit", { path: "/:memberID" });
		this.route('update');
		this.route('create');
	});
	this.route('team', function() {
		this.route("id", { path: ':teamID' 	}, function() {
			this.route("comfortStation", function() {
				this.route("list");
				this.route("create", { path: '/'});
				this.route("update", { path: ':stationID'});
			});

			this.resource('event', function() {
				this.route("create", { path: '/' });
				this.route("update", { path: ':eventID' });
			});

			this.route("roster", function()	{
				this.route('import');
				this.route('map');
				this.route("calls");
				this.route("call-distribution");
			});

			this.route('events');
			this.route("edit");
		});
	});
	this.resource('eventDetails', { path: 'event' }, function() {
		this.resource('eventID', { path: ':eventID' }, function() {
			this.resource('response',  function() {
				this.route('index', { path: ':responseID' });
			});
		});
	});
	this.resource('directResponse', { path: 'response'}, function() {
		this.route('index', { path: ':responseID' })
	});
	this.route("certification", function() {
		this.route("list");
		this.route("tcreate");
		this.route("tupdate", { path: ":certificationID" }, function() {
		
		});
		this.route("class", function() {
			this.route("tcreate");
			this.route("tupdate", { path: ":cClassID" });
		});
	});
	//this.route("where", { path: "where/:teamID" });
	this.route("where");

	// this.resource('response', function()
	// 	{
	// 			this.route('responseID', { path: '/:responseID' }	);
	// 			// , function()
	// 			// 	{
	// 			// 		this.route('/:eventID');
	// 			// 	});
	// 	});
});

CERTApps.moveUpData = function(data)
{
	return CERTModels.moveUpData(data);
}

CERTApps.BaseRoute = Ember.Route.extend(
{
	moveUpData: function(data)
	{
		return CERTApps.moveUpData(data);
	}
});

CERTApps.ApplicationRoute = CERTApps.BaseRoute.extend(
{
	model: function(params)
	{
		console.group("CERTApps.ApplicationRouter model");
		console.log('params, args', params, arguments);

		var a = CERTApps.Member.lookup();

		var t = a.then(function(obj)
		{ 
			var obj = this.moveUpData(obj); 

			return obj;
		}.bind(this));

		t.then(function(obj){ obj.year = (new Date().getFullYear()); });

		var t2 = t.then(function(obj)
		{
			obj.Member = CERTApps.Member.create(obj.Member); 
			console.log('App model returning', obj); 

			var model = CERTApps.AppModel.create(obj);

			var p = CERTApps.Team.lookup().then(
				function(team)
				{ 
					console.log('model resolved for team', team); 
					model.set('Team', team); 
					console.log('after set model', model); 

					return model
				}
			);

			// var team = this.modelFor("team");
			// model.set("Team", team);

			return p; 
		}.bind(this));

		t2.then(function() {
			console.log("attempt to trigger team lookup");
			var team = this.modelFor("team");

			if( team ) {
				team.then(function(data) {
					console.log("team.then", data);
				});
			}
		}.bind(this));


		console.groupEnd();

		return t2;
	},

	setupController: function(controller, model)
	{
		console.group("CERTApps.ApplicationRouter setupController");
		console.log('model, controller, args', model, controller, arguments);

		controller.set('model', model);

		console.groupEnd();
	}	
});

CERTApps.ApplicationController = Ember.Controller.extend(
{

});

CERTApps.LandingRoute = Ember.Route.extend(
{
	model: function(params)
	{
		console.group("CERTApps.LandingRouter model");
		console.log('params, args', params, arguments);
		console.groupEnd();
	},

	setupController: function(controller, model)
	{
		console.group("CERTApps.LandingRouter setupController");
		console.log('model, controller, args', model, controller, arguments);
		console.groupEnd();
	}	

});

CERTApps.LandingController = Ember.Controller.extend(
{
	model: function(params)
	{
		console.group("CERTApps.LandingController model");
		console.log('params, args', params, arguments);
		console.groupEnd();
	}	
});

CERTApps.MemberRoute = Ember.Route.extend(
{
	actions:
	{

	},

	model: function(params)
	{
		console.group("CERTApps.MemberRoute model");
		console.log('params, args', params, arguments);

		var appModel = this.modelFor('application');
		//var model = null;
		var model = { member: appModel.Member };

		console.log('appModel, model', appModel, model);
		console.groupEnd();

		return model;
	},
});


CERTApps.TeamRoute = Ember.Route.extend(
{
	actions:
	{
	},

	model: function(params)
	{
		console.group("CERTApps.TeamRoute model");
		console.log('params, args', params, arguments);

		var appModel = this.modelFor('application');

		var model = null;
		var appTeam = appModel.get("Team");
		if( appTeam  ) {
			model = appTeam;
			console.log("reusing appModel.Team", appTeam.toString(), model);
		}

		if( ! model )
		{
			if(params)
			{
				if( params.teamID )
				{
					console.log("lookup team from params.teamID", params);
					model = CERTApps.Team.lookup(params.teamID);
					model.then(function() { console.log("teamId"); });
				}
			}

			if( !model )
			{
				console.log("model is not set, using wildcard team lookup")
				model = CERTApps.Team.lookup();
				model.then(function() { console.log("wildcard"); });
			}
			model.then(function(model){
				console.log("resolved TeamRoute model", model.toString(), model); 
				appModel.set("Team", model);
			});
		}

		if( ! model )
		{
			log.error("Should never leave without model set");
		}

		console.groupEnd();

		return model;
	},

	serialize: function(model)
	{
		console.group("CERTApps.TeamRoute serialize");

	//	console.log('model', model);
		var obj = { teamID: model.get('KeyID') };

		console.groupEnd();

		return obj;
	}

});

CERTApps.RosterTableComponent = Ember.Component.extend({
	actions:
	{
		changedCalledBy: function(member, team) {
			console.group("CERTApps.RosterTableComponent actions.changedCalledBy");
			console.log("calledBy", member.get("calledBy"));
			console.log("team, team");

			if( member.get("calledBy") )
			{
				console.log("member", member);

				//var team = this.modelFor("team");
				member.set("calledByStatus", "saving");
				var p = CERTApps.Member.changeCalledBy(member, team);

				p.then(
					function rosterRouteActionsChangeCalledBySuccess(data) {
						console.log("rosterRouteActionsChangeCalledBySuccess", arguments)

						if( data.Error ) {
							console.log("data.Error", arguments)
							this.set("calledByStatus", "failed");
	 
						} else {
							this.set("calledByStatus", "saved");

							window.setTimeout(function clearStatusUpdateIcon() {
								console.log("clearStatusUpdateIcon", arguments)
								this.set("calledByStatus", "clear");
							}.bind(this), 
							5000
							);
						}
					}.bind(member),

					function rosterRouteActionsChangeCalledByFailure(xhr, status, error) {
						console.log("rosterRouteActionsChangeCalledByFailure", arguments)
						this.set("calledByStatus", "failed");
					}.bind(member)

				);
			}

			console.groupEnd();
		},

		toggleActive: function(mem, team) {
			console.group("CERTApps.RosterTableComponent actions.toggleActive");
			console.log("mem, team", mem, team);

			var p = mem.toggleActive(team);

			p.then(function toggleActiveSuccess(data)
			{
				console.log("then toggleActiveSuccess", data);
			});

			console.groupEnd();
		},

		toggleEnabled: function(mem, team) {
			console.group("CERTApps.RosterTableComponent actions.toggleEnabled");
			console.log("mem, team", mem, team);

			var p = mem.toggleEnabled(team);

			p.then(function toggleEnabledSuccess(data)
			{
				console.log("then toggleEnabledSuccess", data);
			});

			console.groupEnd();
		},

		memberEdit: function(mem, team) {
			console.group("CERTApps.RosterTableComponent actions.memberEdit");
			console.log("mem, team", mem, team);

			this.sendAction("onMemberEdit", mem, team);

			console.groupEnd();			
		},

		removeCaller: function teamIdRosterIndexRouteRemoveCaller(member, team) {
			console.group("removeCaller");

			var data = {
				Member: member.get("KeyID"),
				CalledBy: 0,
				Team: team.get("KeyID")
			};

			var settings = {
				url: "/api/member/calledBy",
				method: "POST",
				data: JSON.stringify(data)
			};

			console.log("settings", settings);
			var p = $.ajax(settings);

			var t = p.then( 
				function removeCallerSuccess(data) {
					member.set("calledBy",  null);
					member.set("calledByStatus", "saved");

					window.setTimeout(function clearStatusUpdateIcon() {
						member.set("calledByStatus", "clear");
					}.bind(this), 
					5000
					);
				},
				function removeCallerFailure(data) {
					member.set("calledByStatus", "failed");
				}
			);

			console.groupEnd();

			return t;
		}
	}
});

CERTApps.TeamIdRosterRoute = CERTApps.BaseRoute.extend(
{
	actions:
	{
		addMember: function(team) {
			console.log("CERTApps.TeamIdRosterRoute actions.addMember transitionTo with", team);
			//this.transitionTo("member.create", team);
			this.transitionTo("member.create");
		},

		memberEdit: function(mem, team) {
			console.group("CERTApps.RosterTableComponent actions.editMember");
			console.log("mem, team", mem, team);

			this.transitionTo("member.edit", mem);

			console.groupEnd();
		}
	},

	model: function(params)
	{
		console.group("CERTApps.RosterRoute model");
		console.log('params, args', params, arguments);

		var team = this.modelFor('team');

		var settings = 
		{
			url: '/team/roster',
			//type: 'json',
			dataType: 'json',
			method: 'get',
			data: 
			{
				team: team.get('KeyID') || 0
			}
		};

		console.log('getRoster', settings)

		var a = $.ajax(settings);

		var appModel = this.modelFor('application');

		var t = a.then(function(obj){ return this.moveUpData(obj); }.bind(this));
		var t2 = t.then(function(obj) 
		{ 
			console.log('t2 obj', obj, 'appModel', appModel);

			var parsed = Ember.A([]);
			if( obj.Members )
			{
				if( team ) {
					team.get("officers").clear();
				}

				for( var x = obj.Members.length - 1; x >= 0; x-- )
				{
					var o = obj.Members[x];
					var m = CERTApps.Member.parse(o, team);

					m.loggedInMember = appModel.Member;

					parsed.unshiftObject(m);
				}

				if( team ) {
					team.get("officers").sort(CERTApps.Team.sortOfficerDropDown);
				}
			}
			obj.loggedInMember = appModel.Member;
			obj.Members = parsed;

			console.log("team, obj.Team", team, obj.Team);

			obj.Team = team;

			return obj; 
		}.bind(this));		

		console.groupEnd();

		return t2;
	},
	
	serialize: function(model)
	{
		console.group("CERTApps.RosterRoute serialize");

	//	console.log('model', model);
		var obj = { teamID: model.get('KeyID') };

		console.groupEnd();

		return obj;
	}
});

CERTApps.RosterEntryController = Ember.Controller.extend({
	triggerChangedCalledBy: function triggerChangedCalledBy(controller) {
		//console.log("test controller", controller);

		var member = controller.get("model");
		var team = controller.get("parentController.team");
		console.log("member.calledBy", member.get("calledBy"));
		if( member.get("calledBy") !== null ) {
			this.send("changedCalledBy", member, team);
		}
	}.observes("model.calledBy")
});

CERTApps.AppModel = CERTApps.BaseObject.extend(
{
	Member: null,
	Team: null,
});

CERTApps.Roster = CERTApps.BaseObject.extend();
CERTApps.Roster.reopenClass(
{
	parseInput: function(rawData)
	{
		console.group('CERTApps.Roster.parseInput');

		var lines = rawData.split('\n');
		var lineLen = lines.length;

		var delimiter = '\t';

		if( lines[0].indexOf(delimiter) == -1 )
		{
			delimiter = ','
		}

		console.log('parsing', lineLen, 'lines using delimiter *', delimiter,'*');

		var toImport = Ember.A([]);

		for( var x = 0; x < lineLen; x++ )
		{
			var line = lines[x];

			if( line && Ember.$.trim(line).length > 0 )
			{
				var cols = line.split(delimiter);
				var colsLen = cols.length;

				console.log('line', x,'cols', colsLen, '\t\t', line);
				if( colsLen > 0 )
				{
					var obj = Ember.Object.create({
						selected: true,
						cols: Ember.A([]),
						idx: x
					});

					for( var y = 0; y < colsLen; y++ )
					{
						obj.cols.pushObject({name: '_c' + y.toString(), value: $.trim(cols[y])});
					}

					//console.debug('obj', JSON.stringify(obj));

					toImport.pushObject(obj);
				}
			}
		}

		console.log('toImport', toImport);
		console.groupEnd();

		return toImport;
	},

	saveImport: function(toImport)
	{
		console.group('CERTApps.Roster.saveImport');

		var mapping = toImport.mapping;
		var data = toImport.data.ParsedColumnsForImport;
		var teamID = toImport.Team.KeyID;

		console.log('mapping', mapping);
		console.log('data', data);

		var members = this.parseMembers(mapping, data);

		this.saveMembers(members, teamID);
	},

	parseMembers: function(mapping, data)
	{
		console.group("CERTApps.Roster.parseMembers");

		var translateColumn = {
			Cell: "cellFormatted",
			HomePhone: "homePhoneFormatted"
		};

		var members = Ember.A([]);
		var dataLen = data.length;
		for( var r = 0; r < dataLen; r++ )
		{
			var row = data[r];

			if( row.selected )
			{
				var m = CERTApps.Member.create();
				for( var c = mapping.length - 1; c >= 0; c-- )
				{
					var col = mapping[c];
					var val = row.cols[c].value;
					console.log('r, c, col, val', r, c, col, val);

					if( col != undefined )
					{
						var transCol = translateColumn[col] || col;

						m.set(transCol, val);
					}
				}

				console.log('m', m);
				members.pushObject(m);
			}
		}

		console.log('members', members);
		console.groupEnd();

		return members;
	},

	saveMembers: function(members, teamID)
	{
		console.group('CERTApps.Roster.saveMembers');

		var obj = 
		{
			TeamID: teamID,
			Members: members
		}

		var settings = 
		{
			url: '/team/roster/import',
			type: 'json',
			dataType: 'json',
			method: 'post',
			data: JSON.stringify(obj) + "\r\n"
		};

		console.log('roster import request', settings)

		var a = $.ajax(settings);
		a.then(function(obj){ console.log('roster import', obj); }.bind(this));		

		console.groupEnd();
	},

	toggle: function(row, imports, up)
	{
		console.group('CERTApps.Roster.toggle');
		console.log('row, up', row, up);

		var start = 0;
		var limit = row.idx;

		if( up == false )
		{
			start = row.idx;
			limit = imports.length - 1;
		}

		console.log('start, limit', start, limit);

		for( var x = start; x <= limit; x++ )
		{
			var r = imports[x];

			//console.log('toggling', r);
			r.toggleProperty('selected');
		}

		console.groupEnd();
	}
});

CERTApps.TeamIdRosterImportRoute = Ember.Route.extend(
{
	actions:
	{
		parseInput: function(content)
		{
			console.group('CERTApps TeamIdRosterImportRoute actions parseInput');

			content = Ember.Object.create(content);
			console.log('content', content);

			var parsed = CERTApps.Roster.parseInput(content.data.RawPasteDataForImport);

			var parsedCols = content.get('data.ParsedColumnsForImport')
			parsed.forEach( function(item) {
				parsedCols.pushObject(item);
			});

			if( parsed.length > 0 )
			{

				var importCols = content.get('data.importCols');

				parsed[0].cols.forEach( function(item) {
					importCols.pushObject(item);
				});
			}
			
			console.groupEnd();
		},

		save: function(content)
		{
			console.group('CERTApps TeamIdRosterImportRoute actions save');

			content = Ember.Object.create(content);
			console.log('content', content);

			CERTApps.Roster.saveImport(content);

			console.groupEnd();

		},

		toggleUp: function(row, imports)
		{
			console.group('CERTApps TeamIdRosterImportRoute actions toggleUp');
			//console.log('row, imports', row, imports);

			CERTApps.Roster.toggle(row, imports, true);

			console.groupEnd();

		},

		toggleDown: function(row, imports)
		{
			console.group('CERTApps TeamIdRosterImportRoute actions toggleUp');
			//console.log('row, imports', row, imports);

			CERTApps.Roster.toggle(row, imports, false);

			console.groupEnd();

		}

	},

	model: function(params)
	{
		console.group('CERTApps TeamIdRosterImportRoute model')
		var teamModel = this.modelFor('team');
		var appModel = this.modelFor('application');

		teamModel.loggedInMember = appModel.Member;

		var model = {
			Team: teamModel,
			data: 
			{
				importCols: Ember.A([]),
				ParsedColumnsForImport: Ember.A([]),
				RawPasteDataForImport: "",
				memberFields: teamModel.loggedInMember.getFields()
			}
		}		

		console.log('model', model);
		console.groupEnd();

		return model;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps TeamIdRosterImportRoute setupController')

		controller.set('model', model);

		console.log('controller, model', controller, model);
		console.groupEnd();

		return;		
	}

});

CERTApps.TeamIdRosterIndexRoute = Ember.Route.extend(
{
	actions:
	{
		
	},

/*	model: function(params)
	{
		console.group('CERTApps RosterIndexRoute model')
		var teamModel = this.modelFor('team');
		var appModel = this.modelFor('application');

		teamModel.loggedInMember = appModel.Member;

		console.log('teamModel', teamModel);
		console.groupEnd();

		return teamModel;
	},*/

	setupController: function(controller, model)
	{
		console.group('CERTApps TeamIdRosterIndexRoute setupController')

		controller.set('model', model);

		console.log('controller, model', controller, model);
		console.groupEnd();

		return;		
	},

	serialize: function(model)
	{
		console.group("CERTApps.TeamIdRosterIndexRoute serialize");

		console.log('model', model);
		var obj = { teamID: model.get('KeyID') };

		console.groupEnd();

		return obj;
	}
});

CERTApps.TeamIdRosterIndexController = Ember.Controller.extend({
	membersActive2: function() {
		var members = this.get("model.Members");

		var retval = members.filterBy("Active", true);

		return retval;
	}.property("model.Members.@each"),

	membersEnabled: Ember.computed.filterBy("model.Members", "enabled", true),
	membersDisabled: Ember.computed.sort("membersDisabledUnsorted", "memberSorting"),

	memberSorting: Ember.A(["FirstName","LastName"]),
	membersActive: Ember.computed.sort("membersActiveUnsorted", "memberSorting"),
	membersInactive: Ember.computed.sort("membersInactiveUnsorted", "memberSorting"),

	membersDisabledUnsorted: Ember.computed.filterBy("model.Members", "enabled", false),
	membersActiveUnsorted: Ember.computed.filterBy("membersEnabled", "active", true),
	membersInactiveUnsorted: Ember.computed.filterBy("membersEnabled", "active", false),

	membersInactive2: function() {
		var members = this.get("model.Members");

		var retval = members.filterBy("Active", false);

		return retval;
	}.property("model.Members.@each")
});

CERTApps.TeamIdRosterCallsRoute = Ember.Route.extend(
{
	actions:
	{
	},

	model: function(params)
	{
		console.group('CERTApps TeamIdRosterCallsRoute model')
		var rosterModel = this.modelFor("teamIdRoster");
		var appModel = this.modelFor("application");

		var membersToCall = rosterModel.Members.filterBy("calledBy", appModel.Member.KeyID);
		var model = { membersToCall: membersToCall, loggedInMember: appModel.Member };

		console.groupEnd();

		return model;
	},
});


CERTApps.TeamIdRosterCallDistributionRoute = Ember.Route.extend(
{
	actions:
	{
	},

	model: function(params)
	{
		console.group('CERTApps TeamIdRosterCallsRoute model')
		var rosterModel = this.modelFor("teamIdRoster");
		var appModel = this.modelFor("application");

		var membersToCall = rosterModel.Members;
		var memberCallMap = {};
		var memberCallBreakdown = Ember.A([]);
		var membersByKey = {};

		membersToCall.forEach( function (member) {
			var calledByID = member.get("calledBy");
			var item = memberCallMap[calledByID];
			if( ! item ) {
				item = [];
				console.log("adding calledBy to map", calledByID, member);
				memberCallMap[calledByID] = item;
			}
			item.pushObject(member);
			console.log("adding member to map", member.get("keyID"), member)
			membersByKey[member.get("keyID")] = member;
		});

		console.log("membersByKey", membersByKey);
		console.log("memberCallMap", memberCallMap);

		for( var caller in memberCallMap ) {
			var callerObj = null;

			if( (caller || 0).toString() === "0" ) {
				callerObj = CERTApps.Member.create({firstName: "No Caller Set", LastName: ""});
			} else {
				callerObj = membersByKey[caller];
			}
			console.log("caller", caller, "callerObj", callerObj);

			var obj = {caller: callerObj, calls: [], calledBy: caller};
			memberCallMap[caller].forEach( function(item) {
				if( item.get("Active") ) {
					obj.calls.push(item);
				}
			});
			memberCallBreakdown.push(obj)
		}

		var model = { memberCallBreakdown: memberCallBreakdown, loggedInMember: appModel.Member };

		console.log("model", model);
		console.groupEnd();

		return model;
	},
});


// CERTApps.ApplicationController = Ember.Controller.create(
// {
// 	model: function(params)
// 	{
// 		console.group("CERTApps.ApplicationController model");

// 		console.log('params, args', params, arguments);

// 		console.groupEnd();
// 	}	
// });

CERTApps.Member = CERTApps.BaseObject.extend(
{
	save: function(team)
	{
		console.group("CERTApps.Member save")

		this.cleanData();

		console.log('saving this, team', this, team);
		this.set("statuses.save", "saving");

		var settings = 
		{
			url: '/api/member/save',
			method: 'post',
			data: {Member: this, Team: team}
		};

		console.log('save member request', settings)

		var a = CERTApps.ajax(settings);
		var t = a.then(
			function(obj){ 
				obj = this.moveUpData(obj);

				this.sync(obj.Member);
				this.set("statuses.save", "success");
			}.bind(this),
			function() {
				this.set("statuses.save", "failed");
			}
		);

		console.groupEnd();

		return t;
	},

	cleanData: function()
	{
		this._super();

		var email = this.get("Email");
		if( email ) {
			this.set("Email", email.toLowerCase());
		}

		email = this.get("Email2");
		if( email ) {
			this.set("Email2", email.toLowerCase());
		}
		
	},

	emailDisplay: function()
	{
		var retval = this.get('ShowEmail') || this.get('loggedInMember.CanLookup');
	
		//console.log('EmailDisplay', this.get('ShowEmail'), this.get('loggedInMember.CanLookup'), retval, this.get('loggedInMember'));

		return retval;
	}.property('ShowEmail', 'loggedInMember.CanLookup'),

	cellDisplay: function()
	{
		var retval = this.get('ShowCell') || this.get('loggedInMember.CanLookup');
	
		//console.log('CellDisplay', this.get('ShowCell'), this.get('loggedInMember.CanLookup'), retval, this.get('loggedInMember'));
		
		return retval;
	}.property('ShowCell', 'loggedInMember'),

	line2Display: function()
	{
		CERTModels.line2Display(this);
	}.property('line2'),

	getFields: function()
	{
		console.group('getFields');

		var fields = Ember.A([]);
		var include = Ember.A(["ShowCell","ShowEmail","OKToText","RadioID","Town","OEM","Officer","Active","FirstName","LastName","Cell","HomePhone","Email","Email2","line1","line2","City","State","Zip"]);

		for( f in this )
		{
			//console.log('f', f);
			if( this.hasOwnProperty(f) )
			{
				//console.log('this, has', f);

				if( include.contains(f) )
				{
					var f = f.substring(0,1).toUpperCase() + f.substring(1);
					fields.pushObject(f);	
				} else
				{
					console.log('skipping', f);
				}
			}
		}

		fields.sort();

		console.log('fields', JSON.stringify(fields));
		console.groupEnd();

		return fields;
	},

	cellFormatted: function(key, value, priorValue)
	{
		// setter
		var phone = this.get("Cell") ;

		if (arguments.length > 1) 
		{
			var cleanPhone = this.getCleanPhone(value);

			this.set('Cell', cleanPhone);

			phone = cleanPhone;
		}

		// getter
		var out = null;

		if( phone && phone.length >= 10 )
		{
			var first = phone.substring(0,3);
			var second = phone.substring(3,6);
			var third = phone.substring(6,10);

			out = first + "-" + second + "-" + third;
		} 

		//console.log('out, CellPhone, cleanPhone', out, phone, cleanPhone)

		return out;
	}.property("Cell"),

	cellTelLink: function(key, value, priorValue)
	{

		var phone = this.get("Cell") ;
		var out = "";

		if( phone )	out = "tel:" + phone;

		return out;
	}.property("Cell"),

	homePhoneFormatted: function(key, value, priorValue)
	{
		var phone = this.get("HomePhone");
		// setter
		if (arguments.length > 1) 
		{
			var cleanPhone = this.getCleanPhone(value);

			this.set('HomePhone', cleanPhone);

			phone = cleanPhone;
		}

		// getter
		var out = null;

		if( phone && phone.length >= 10 )
		{
			var first = phone.substring(0,3);
			var second = phone.substring(3,6);
			var third = phone.substring(6,10);

			out = first + "-" + second + "-" + third;
		} 

		//console.log('out, HomePhone, cleanPhone', out, phone, cleanPhone)

		return out;
	}.property("HomePhone"),

	homePhoneTelLink: function(key, value, priorValue)
	{
		var phone = this.get("HomePhone") ;
		var out = "";

		if( phone )	out = "tel:" + phone;

		return out;
	}.property("HomePhone"),

	getCleanPhone: function(value)
	{
		var cleanPhone = null;

		if( value )	cleanPhone = value.replace(/\-|\(|\)|\s|\./g, "");

		return cleanPhone;
	},

	emailLink: function(key, value, priorValue)
	{
		var email = this.get("Email");
		var out = "";

		if( email )	out = "mailto:" + email;

		return out;
	}.property("Email"),

	keyID: Ember.computed.alias("KeyID"),
	firstName: Ember.computed.alias("FirstName"),
	fullName: function() {
		return this.get("firstName") + " " + this.get("LastName");
	}.property("firstName", "LastName"),

	officerShortName: function() {
		return this.get("firstName") + " " + (this.get("LastName") || "").substring(0,1)
	}.property("firstName", "LastName"),

	calledByStatus: null,
	calledBySaving: Ember.computed.equal("calledByStatus", "saving"),
	calledBySaved: Ember.computed.equal("calledByStatus", "saved"),
	calledBySaveFailed: Ember.computed.equal("calledByStatus", "failed"),

	calledByIcon: function() {
		var retval ='';

		if( this.get("calledBySaving") ) {
			retval = "fa fa-spinner fa-spin";
		}

		if( this.get("calledBySaved") ) {
			retval = "fa fa-check-circle text-success";
		}

		if( this.get("calledBySaveFailed") ) {
			retval = "fa fa-close text-danger";
		}	

		return retval;
	}.property("calledBySaving", "calledBySaved", "calledBySaveFailed"),

	active: Ember.computed.alias("Active"),

	activeStatus: null,
	activeSaving: Ember.computed.equal("activeStatus", "saving"),
	activeSaved: Ember.computed.equal("activeStatus", "saved"),
	activeSaveFailed: Ember.computed.equal("activeStatus", "failed"),

	activeIcon: function() {
		var retval ='';

		if( this.get("activeSaving") ) {
			retval = "fa-spinner fa-spin";
		}

		if( this.get("activeSaveFailed") ) {
			retval = "fa-close text-danger";
		}

		if( retval == "" ) {
			if( this.get("active") ) {
				retval = "fa-arrow-down action";
			} else {
				retval = "fa-arrow-up action"
			}
		}
			
		return retval;
	}.property("activeSaving", "activeSaved", "activeSaveFailed", "active"),

	activeTitle: function() {
		var retval ='';

		if( this.get("active") ) {
			retval = "Force Inactive";
		} else {
			retval = "Reset to Active";
		}

		return retval
	}.property("active"),

	toggleActive: function(team) {

		this.set("activeStatus", "saving");

		var settings = {
			url: '/api/member/toggle-active',
			data: {member: this.get("keyID"), team: team.get("keyID"), active: !this.get("active")}
		};
		var p = CERTApps.ajax(settings);

		var t = p.then( 
			function memberToggleActiveSuccess(data){
				data = CERTApps.moveUpData(data);

				if( data.error ) {
					this.set("activeStatus", "failed");
				} else {
					this.set("active", data.Active);
					console.log("toggled active for member", this.get("active"), this);
				}

				this.set("activeStatus", "done");

				return data;
			}.bind(this),
			function memberToggleActiveError() {
				this.set("activeStatus",  "failed");
			}.bind(this)
		);

		return t;
	},

	enabled: Ember.computed.alias("Enabled"),

	enabledStatus: null,
	enabledSaving: Ember.computed.equal("enabledStatus", "saving"),
	enabledSaved: Ember.computed.equal("enabledStatus", "saved"),
	enabledSaveFailed: Ember.computed.equal("enabledStatus", "failed"),

	enabledIcon: function() {
		var retval ='';

		if( this.get("enabledSaving") ) {
			retval = "fa-spinner fa-spin";
		}

		if( this.get("enabledSaveFailed") ) {
			retval = "fa-close text-danger";
		}

		if( retval == "" ) {
			if( this.get("enabled") ) {
				retval = "fa-ban action text-danger";
			} else {
				retval = "fa-check action text-success"
			}
		}
			
		return retval;
	}.property("enabledSaving", "enabledSaved", "enabledSaveFailed", "active"),

	enabledTitle: function() {
		var retval ='';

		if( this.get("enabled") ) {
			retval = "Disable Member";
		} else {
			retval = "Enable Member";
		}

		return retval
	}.property("enabled"),

	toggleEnabled: function(team) {

		this.set("enabledStatus", "saving");

		var settings = {
			url: '/api/member/toggle-enabled',
			data: {member: this.get("keyID"), team: team.get("keyID"), enabled: !this.get("enabled")}
		};
		var p = CERTApps.ajax(settings);

		var t = p.then( 
			function memberToggleEnabledSuccess(data){
				data = CERTApps.moveUpData(data);

				if( data.error ) {
					this.set("enabledStatus", "failed");
				} else {
					this.set("enabled", data.Enabled);
					console.log("toggled enabled for member", this.get("enabled"), this);
				}

				this.set("enabledStatus", "done");

				return data;
			}.bind(this),
			function memberToggleActiveError() {
				this.set("enabledStatus",  "failed");
			}.bind(this)
		);

		return t;
	},

	statuses: {},
	saving: Ember.computed.equal("statuses.save", "saving"),
	saveSuccess: Ember.computed.equal("statuses.save", "success"),
	saveFailed: Ember.computed.equal("statuses.save", "failed"),

	savingIcon: function() {
		var retval ='';

		if( this.get("saving") ) {
			retval = "fa-spinner fa-spin";
		}

		if( this.get("saveSuccess") ) {
			retval = "fa-check-circle text-success";
		}

		if( this.get("saveFailed") ) {
			retval = "fa-close text-danger";
		}	

		return retval;
	}.property("saving", "saveSuccess", "saveFailed"),

});

CERTApps.Member.reopenClass({
	parse: function(data, team) {
		console.group("CERTApps.Member.parse");
		console.log("data, team", data, team);

		var m = CERTApps.Member.create(data);

		if( team )
		{
			console.log("checkimg Member for Officer");
			if( m.get("Officer") ) {
				console.log("adding Officer", m, "to team", team);

				team.get("officers").pushObject(m)
			}

		}

		console.groupEnd();

		return m;
	},

	changeCalledBy: function(member, team) {
		console.group("CERTApps.Member.changeCalledBy");
		console.log("member, team", member, team);

		var calledBy = member.get("calledBy");
		var options = 
		{
			url: "/api/member/calledBy",
			data: {member: member.get("KeyID"), calledBy: calledBy, team: team.get("KeyID")},
		};

		var p = CERTApps.ajax(options);

		return p;
	},

	lookup: function(id) {
		console.group("CERTApps.Member.lookup");
		console.log("id", id);

		var data = '';

		if( id ) {
			data = "member=" + id.toString();
		}

		var settings = 
		{
			url: '/api/member?' + data,
			data: null
		};

		var a = CERTApps.ajax(settings);
		var t = a.then( function(data) {
			CERTApps.moveUpData(data);

			return data;
		});
		console.groupEnd();

		return t;
	}
})

CERTApps.TimesObject = CERTApps.BaseObject.extend(
{
	init: function()
	{
		console.group('CERTApps.TimesObject init');
		this._super();
		
		console.groupEnd();
	},

	parseDate: function(date, time)
	{
		var retval = null;

		if( date )
		{
			var pieces = date.split('/');
			if( pieces[2].length == 2 ) pieces[2] = "20" + pieces[2];
			var dateParsed = pieces[2] + '-' + pieces[0] + '-' + pieces[1];
			console.log('formatted date', dateParsed);

			var timeParsed = time;
			if( timeParsed && timeParsed.length == 4 )
			{
				timeParsed = timeParsed.substring(0,2) + ':' + timeParsed.substring(2) + ':00';
				console.log('formatted time', timeParsed);
			}		

			retval = CERTApps.getDateAndTimeFormatted(dateParsed, timeParsed);
		}
		return retval;
	},

	leftZeroPad: function(value)
	{
		if( value.length == 1 ) value = '0' + value;

		return value;
	},

	dateBreakout: function(dateString)
	{
		var date = new Date(dateString);

		var retval = 
		{
			dateObj: date,
			dateString: dateString
		};

		retval.timestamp = date.getTime();

		retval.month = (date.getMonth() + 1).toString();
		retval.date = date.getDate().toString();
		retval.fullYear = date.getFullYear().toString();
		retval.shortYear = retval.fullYear.substring(2);

		retval.month = this.leftZeroPad(retval.month);
		retval.date = this.leftZeroPad(retval.date);

		retval.hours = date.getHours().toString();
		retval.minutes = date.getMinutes().toString();
		retval.seconds = date.getSeconds().toString();

		retval.hours = this.leftZeroPad(retval.hours);
		retval.minutes = this.leftZeroPad(retval.minutes);
		retval.seconds = this.leftZeroPad(retval.seconds);

		retval.prettyDate =  retval.month + '/' + retval.date + '/' + retval.shortYear;
		retval.prettyDateFullYear =  retval.month + '/' + retval.date + '/' + retval.fullYear;
		retval.prettyTime =  retval.hours + '' + retval.minutes

		retval.prettyDateTime = retval.prettyDate + ' ' + retval.prettyTime

		return retval;
	},

	parseDatesToJS: function()
	{
		console.group('parseDatesToJS');

		var strDate = this.get('EventStart');
		var date = new Date(strDate);

		this.set('startTimestamp', date.getTime());

		console.log('strDate, date', strDate, date);
		console.groupEnd();
	},

});

CERTApps.Event = CERTApps.TimesObject.extend(
{
	responses: null,

	init: function()
	{
		console.group('CERTApps.Event init');
		this._super();
		
		this.parse();
		
		console.groupEnd();
	},

	save: function(team)
	{
		console.group('CERTApps.Event save')
		
		this.parseDates();

		console.log('will save event', this);

		var settings = 
		{
			url: '/event/save',
			type: 'json',
			dataType: 'json',
			data: JSON.stringify({ Event: this, Team: team})
		};

		console.log('saving event data', settings)

		var a = $.ajax(settings);
		var t = a.then(function(obj)
			{ 
				var move = this.moveUpData(obj); 

				console.log('save returning', move); 
				obj = move; 
				return move; 
			}.bind(this));

		a.then(function(obj){ console.log('a.then', JSON.stringify(obj)); }.bind(this));
		t.then(function(obj){ console.log('t.then', JSON.stringify(obj)); }.bind(this));

		t.then(function(obj)
			{ 
				this.sync(obj); 
			}.bind(this)
		);

		console.groupEnd();

		return a;
	},

	sendReminders: function(team)
	{
		console.group('CERTApps.Event sendReminders')
		
		this.parseDates();

		console.log('will send reminders for  event', this);

		var t = {KeyID: team.get('KeyID')};
		var ev = {KeyID: this.get('KeyID')};

		var settings = 
		{
			url: '/event/reminders/send',
			type: 'json',
			dataType: 'json',
			data: JSON.stringify({ Event: ev, Team: t, RemindersToSend: { NoResponse: true}})
		};

		console.log('sending event reminders', settings)

		var a = $.ajax(settings);
		var t = a.then(function(obj)
			{ 
				var move = this.moveUpData(obj); 

				console.log('sendReminder returning', move); 
				obj = move; 
				return move; 
			}.bind(this));

		a.then(function(obj){ console.log('a.then', JSON.stringify(obj)); }.bind(this));
		t.then(function(obj){ console.log('t.then', JSON.stringify(obj)); }.bind(this));

		console.groupEnd();

		return a;
	},


	parseDates: function()
	{
		this.set('EventStart', this.parseDate(this.get('eventStartDate'), this.get('eventStartTime')));
		
		var finishDate = this.get('eventFinishDate') || this.get('eventStartDate');
		this.set('EventFinish', this.parseDate(finishDate, this.get('eventFinishTime')));

		var meetTime = this.get('arriveTime');
		if( meetTime )
		{
			this.set('MeetTime', this.parseDate(this.get('eventStartDate'), meetTime));
		} else
		{
			this.set('MeetTime', undefined);
		}

	},

	parse: function()
	{
		console.group("CERTApps.Event parse")

		var es = this.get('EventStart');
		var startDB = this.dateBreakout(es);
		console.log('EventStart, startDB', es, startDB);

		if( ! startDB.timestamp )
		{
			startDB = this.dateBreakout(new Date().toString());
			console.log('overriding date breakout with now', startDB);
		}

		this.set('eventStartDate', startDB.prettyDate);

		if( es )
		{
			this.set('eventStartTime', startDB.prettyTime);
		}

		var ef = this.get('EventFinish');
		var finishDB = this.dateBreakout(ef);
		console.log('EventFinish, finishDB', ef, finishDB);

		if( ! finishDB.timestamp )
		{
			finishDB = this.dateBreakout(new Date().toString());
			console.log('overriding date breakout with now', finishDB);
		}

		if( startDB.prettyDate !== finishDB.prettyDate )
		{
			this.set('eventFinishDate', finishDB.prettyDate);
		}

		if( ef )
		{
			this.set('eventFinishTime', finishDB.prettyTIme);
		}

		this.set('startDateBreakout', startDB);
		this.set('finishDateBreakout', finishDB);

		console.groupEnd();
	},

	prettyEventStart: function()
	{
		var es = this.get('EventStart');

		var db = this.dateBreakout(es);

		return db.prettyDateTime;

	}.property('EventStart'),

	responsesYes: function()
	{
		var responses = this.get('responses');

		var retval = responses.filterBy('Attending', true).filterBy('Sure', true);

		return retval;
	}.property('responses.@each'),

	responsesMaybe: function()
	{
		var responses = this.get('responses');

		var retval = responses.filterBy('Attending', true).filterBy('Sure', false);

		return retval;
	}.property('responses.@each'),

	responsesNo: function()
	{
		var responses = this.get('responses');

		var retval = responses.filterBy('Attending', false);

		retval = retval.filterBy('Sure', true);

		return retval;
	}.property('responses.@each'),

	responsesPending: function()
	{
		var responses = this.get('responses');

		var retval = responses.filter(this.filterSent.bind(this));

		retval.filterBy('Attending', false);

		retval = retval.filterBy('Sure', false);

		return retval;
	}.property('responses.@each'),

	responsesUnsent: function()
	{
		var responses = this.get('responses');

		console.group("responses.filter for Unsent");
		var retval = responses.filter(this.filterUnSent.bind(this));
		console.groupEnd();

		return retval;
	}.property('responses.@each'),

	link1Label: function()
	{
		var deploy = this.get('Deployment');
		var retval = "???";

		if( deploy )	
		{
			retval = "IAP";
		} else
		{
			retval = "Agenda";
		}

		return retval;
	}.property('Deployment'),

	filterSent: function(item, index, list)
	{
		console.log('filter item, index, list', item, index);
		var eItem = CERTApps.MemberEvent.create(item);
		
		return this.filterBySent(eItem, index, list, true);
	},

	filterUnSent: function(item, index, list)
	{
		console.log('filter item, index, list', item, index);
		var eItem = CERTApps.MemberEvent.create(item);
		
		return this.filterBySent(eItem, index, list, false);
	},

	filterBySent: function(item, index, list, sent)
	{
		var rem = item.get('FirstReminder');

		var dRem = new Date(rem);
		var include = (dRem.getTime() > -62135596800000); // Sun Dec 31 0 19:00:00 GMT-0500 in js time
		console.log('rem, dRem, include', rem, dRem, include);

		return (include == sent);
	},

	link2Label: function()
	{
		var meeting = this.get('Meeting');
		var retval = "???";

		if( meeting )	
		{
		} else
		{
			retval = "Roster";
			
		}

		return retval;
	}.property('Meeting'),

	eventType: function(key, value, previous)
	{
		// setter
		if (arguments.length > 1) 
		{
			this.set("Deployment", false);
			this.set("Exercise", false);
			this.set("Meeting", false);

			if( value ) {
				this.set(value, true);
			}
		}

		// getter
		var retval = null;
		var match = false;

		if( match == false )
		{
			retval = 'Deployment';
			if( this.get(retval) )
			{
				match = true;
			}
		}

		if( match == false )
		{
			retval = 'Exercise';
			if( this.get(retval) )
			{
				match = true;
			}
		}

		if( match == false )
		{
			retval = 'Meeting';
			if( this.get(retval) )
			{
				match = true;
			}
		}

		return retval;
	}.property('Deployment', 'Exercise', 'Meeting', 'Certification'),

	showSecondLink: function()
	{
		var retval = "display: none;";
		if( this.get('Deployment') || this.get('Excercise') )
		{
			retval =  "display: show;";
		}

		return retval;
	}.property('Deployment', 'Exercise', 'Meeting', 'Certification'),

	summary: Ember.computed.alias('Summary')
});

CERTApps.Event.reopenClass(
{
	lookup: function(eventID)
	{
		var settings = 
		{
			url: '/eventA',
			//type: 'json',
			dataType: 'json',
			method: 'post',
			data: JSON.stringify( 
				{
					KeyID: parseInt(eventID || 0)
				}
			)
		};

		console.log('get Event', settings)

		var a = $.ajax(settings);

		var t = a.then(function(data)
		{
			var eventData = CERTApps.moveUpData(data).Event;
			var ev = CERTApps.Event.create(eventData);
			
			console.log('returning Event', ev);

			return ev;
		});

		return t;
	}
});

CERTApps.ImportColumnSelect = Ember.Select.extend({
	change: function (ev) 
	{
		console.group('CERTApps.ImportColumnSelect change')
		console.log('this, ev, args', this, ev, arguments);
		
		var element = $('#' + this.elementId);
		//console.log('loading this.elementId, element', this.elementId, element);

		var th = element.closest('th');
		var thead = th.closest('thead');
		var table = thead.closest('table');
		var tbody = table.find('tbody');

		//console.log('thead', thead);

		var selects = thead.find('select.import-column');

		for( var x =  selects.length - 1; x >= 0; x-- )
		{
			var s = selects[x];

			//console.log('s', s.id, s.value);

			if( s.selectedIndex > 0 && s.value == this.selection )
			{
				if( this.elementId != s.id )
				{
					console.log('reseting prior selected column', s.id, s.value);
					s.selectedIndex = 0;

					var $s = $(s);
					var innerTh = $s.closest('th');
					var matchClass = this.getMatchClass(innerTh);

					if( matchClass )
					{
						var tds = tbody.find('td.' + matchClass);

						console.log('tds that match, removing', tds.length, matchClass);

						tds.removeClass('mapped');
					}
				} else
				{
					console.log('no reseting because this is the column we just selected')
				}
			}
		}

		var matchClass = this.getMatchClass(th);

		var content = this.get('controller.model');

		if( ! content.mapping ) content.mapping = Ember.A([]);

		if( matchClass )
		{
			var strIdx = matchClass.substring(2);
			var idx = parseInt(strIdx);

			content.mapping[idx] = this.selection;

			console.log('matchClass, strIdx, idx', matchClass, strIdx, idx);

			var tds = tbody.find('td.' + matchClass);

			console.log('tds that match, adding', tds.length, matchClass);

			tds.addClass('mapped');
		}

		console.groupEnd();
	},

	getMatchClass: function(element)
	{
		console.group('getMatchClass');

		var match = null;
		var classList = element.attr('class').split(' ');

		console.log('checking classList from element', classList, element);
		for( var x = classList.length - 1; x >= 0; x-- )
		{
			var c = classList[x];

			console.log('checking', c, c[0]);

			if( c[0] == '_' )
			{
				match = c;
				break;
			}
		}

		console.log('match', match);

		console.groupEnd();

		return match;
	}
});

CERTApps.EventRoute = Ember.Route.extend(
{
	actions:
	{
		saveEvent: function(content)
		{
			console.group('CERTApps.EventRoute saveEvent');
			var ev = content.Event;

			var team = this.modelFor('team');
			ev.save(team);

			console.groupEnd();
		},

		locationLookup: function(content)
		{
			console.group('CERTApps.EventRoute saveEvent');
			var ev = content.Event;

			ev.save();

			console.groupEnd();
		},

		sendReminders: function(content)
		{
			console.group('CERTApps.EventRoute sendReminders');
			
			console.log('content', content);

			var ev = content.Event;
			var team = this.modelFor('team');

			ev.sendReminders(team);

			console.groupEnd();
		}
	},

	model: function(params)
	{
		console.group('CERTApps.EventRoute model')

		console.log('params', params);

		var model = { Event: CERTApps.Event.create({ EventLocation: {}, ParkingLocation: {} } )};

		console.groupEnd();

		return model;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps.EventRoute setupController')


		controller.set('model', model);

		console.log('controller, model', controller, model);
		console.groupEnd();

		return;		
	},

	serialize: function(model)
	{
		console.group("CERTApps.EventRoute serialize");

	//	console.log('model', model);
		var obj = { eventID: model.get('KeyID') };

		console.groupEnd();

		return obj;
	}

});

CERTApps.EventCreateRoute = Ember.Route.extend(
{	
	actions:
	{
	},

	model: function(params)
	{
		console.group('CERTApps.EventCreateRoute model')

		var eventModel = this.modelFor('event');

		console.log('returning', eventModel);

		console.groupEnd();

		return eventModel;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps.EventCreateRoute setupController')

		model.possibleEventTypes = Ember.A(["Deployment", "Exercise", "Meeting", "Certification"]);

		controller.set('model', model);

		console.log('controller, model', controller, model);
		console.groupEnd();

		return;		
	}
});

CERTApps.TeamIdRosterMapView = Ember.View.extend(
{
	didInsertElement: function()	
	{
		console.group('CERTApps.TeamIdRosterMapView didInsertElement');
		console.log('arguments', arguments);
		console.log('this', this);

        var mapOptions = {
          mapTypeId: google.maps.MapTypeId.ROADMAP
        }

        var mapCanvas = $('#' + this.elementId).find('.map-canvas')[0];
        var map = new google.maps.Map(mapCanvas, mapOptions);
		var maxLat = -300;
		var minLat = 300;
		var maxLong = -300;
		var minLong = 300

        this.get("controller.model.Members").forEach( function(item) {
        	if( item.publicLatitude != 0 ) {
        		if( item.Enabled ) {
		        	var pos = {lat: item.publicLatitude, lng: item.publicLongitude};
					var title = item.KeyID.toString();

		        	if( item.latitude != 0 ) {
			        	pos = {lat: item.latitude, lng: item.longitude};
			        	title = item.get("officerShortName");
		        	}

		        	if( pos.lat > maxLat ) {
		        		maxLat = pos.lat;
		        	}

		        	if( pos.lat < minLat ) {
		        		minLat = pos.lat;
		        	}

		        	if( pos.lng > maxLong ) {
		        		maxLong = pos.lng;
		        	}

		        	if( pos.lng < minLong ) {
		        		minLong = pos.lng;
		        	}

		        	console.log('putting item on map', pos, item);

		        	var icon = "//www.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png";

		        	if( !item.get("active") ) icon = "//www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png";
	        		if( item.get("Officer") ) icon = "//www.google.com/intl/en_us/mapfiles/ms/micons/grn-pushpin.png";

					var marker = new google.maps.Marker({
						position: pos,
						map: map,
						animation: google.maps.Animation.DROP,
						icon: icon,
						title: title
					});
				}
			}
        });
		console.log("sw", minLat, minLong);
		console.log("ne", maxLat, maxLong);
		var sw = new google.maps.LatLng(minLat, minLong);
		var ne = new google.maps.LatLng(maxLat, maxLong);
		var bounds = new google.maps.LatLngBounds(sw, ne);
		
		console.log("fitting bounds", bounds);
		map.fitBounds(bounds);

        console.groupEnd();
    }
});

CERTApps.TeamIdRosterMapRouter = CERTApps.BaseRoute.extend(
{
	setupController: function(controller, model)
	{
		console.group("CERTApps.RosterMapRouter");

		console.groupEnd();
	}

});

CERTApps.EventUpdateRoute = CERTApps.BaseRoute.extend(
{	
	actions:
	{
	},

	model: function(params)
	{
		console.group('CERTApps.EventUpdateRoute model')

		console.log('params', params);

		var obj = {
			KeyID: parseInt(params.eventID)
		};

		var settings = 
		{
			url: '/event',
			type: 'json',
			dataType: 'json',
			data: JSON.stringify(obj)
		};

		console.log('requesting data', settings)

		var a = $.ajax(settings);
		var t = a.then(function(obj)
			{ 
				console.log('obj', obj);

				var move = this.moveUpData(obj);

				console.log('move', move);

				move.Event = CERTApps.Event.create(move.Event); 

				console.log('EventUpdate model returning', move); 
				obj = move; 
				return move; 
			}.bind(this)
		);

		t.then(function(obj)
		{
		});

		console.groupEnd();

		return t;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps.EventUpdateRoute setupController')

		controller.set('model', model);

		model.possibleEventTypes = Ember.A(["Deployment", "Exercise", "Meeting", "Certification"]);

		console.log('controller, model', controller, model);
		console.groupEnd();

		return;		
	},

	serialize: function(model)
	{
		console.group("CERTApps.EventUpdateRoute serialize");

		var ev = model;
		if( ev.Event ) ev = ev.Event;

		var obj = { eventID: ev.get('KeyID') };

		console.groupEnd();

		return obj;
	}

});


CERTApps.TeamIndexRoute = CERTApps.BaseRoute.extend(
{
	// model: function(params)
	// {
	// 	console.group("CERTApps.TeamIndexRoute model");

	// 	console.log('params', params);

	// 	var model = this.modelFor('team');
		
	// 	console.log('model', model);

	// 	console.groupEnd();

	// 	return model;
	// },

	afterModel: function(team, transition) 
	{
		console.group("CERTApps.TeamIndexRoute afterModel");

		console.log('args', arguments);

		this.transitionTo('teamID', team);

		console.groupEnd();
	},

	serialize: function(model)
	{
		console.group("CERTApps.TeamIndexRoute serialize");

	//	console.log('model', model);

		var obj = { teamID: model.get('KeyID') };

		console.groupEnd();

		return obj;
	}
});

CERTApps.TeamIdRoute = CERTApps.BaseRoute.extend(
{

	model: function(params)
	{
		console.group("CERTApps.TeamIDRoute model");

		console.log('params', params);
 
		var model = this.modelFor('team');
		
		console.log('model', model);

		console.groupEnd();

		return model;
	},
/*
	afterModel: function(team, transition) 
	{
		console.group("CERTApps.TeamIDRoute afterModel");

		console.log('args', arguments);

   		//this.transitionTo('teamID', team);

		console.groupEnd();

	}
*/
	serialize: function(model)
	{
		//console.group("CERTApps.TeamIdRoute serialize");

		var params = { teamID: model.get('KeyID') };

		//console.log('params, model', params, model);
		//console.log('params', params);
		//console.groupEnd();

		return params;
	}
});

CERTApps.Team = CERTApps.BaseObject.extend({
	officers: null,

	uiStatuses: null,

	init: function() {
		console.log("CERTApps.Team init");
		this.set("officers", Ember.A([]));
		this.set("uiStatuses", {saving: ""});
	},

	name: Ember.computed.alias("Name"),
	city: Ember.computed.alias("City"),
	state: Ember.computed.alias("State"),
	zip: Ember.computed.alias("Zip"),
	googleAPIKey: Ember.computed.alias("GoogleAPIKey"),
	forecastIOAPIKey: Ember.computed.alias("ForecastIOAPIKey"),
	membersEmail: Ember.computed.alias("MembersEmail"),
	officersEmail: Ember.computed.alias("OfficersEmail"),

	save: function() {
		this.set("uiStatuses.saving", "saving")

		var options = {
			url: "/api/team/save",
			data: {team: this}
		};

		var p = CERTApps.ajax(options);

		var t = p.then(
			function teamSaveSuccess(data) {
				console.log("teamSaveSuccess", data);
				this.set("uiStatuses.saving", "success");

			}.bind(this),
			function teamSaveFailure(arguments) {
				console.log("teamSaveFailure", arguments);
				this.set("uiStatuses.saving", "failed");
			}.bind(this)
		);

		return t;
	},

	uiSaving: Ember.computed.equal("uiStatuses.saving", "saving"),
	uiSaveSuccess: Ember.computed.equal("uiStatuses.saving", "success"),
	uiSaveFailure: Ember.computed.equal("uiStatuses.saving", "failed"),

	savingIcon: function() {
		var retval = "";
		if( this.get("uiSaving") ) {
			retval = "fa-spin fa-spinner";
		} else {
			if( this.get("uiSaveSuccess") ) {
				retval = "fa-check-circle text-success";
			} else {
				if( this.get("uiSaveFailure") ) {
					retval = "fa-close text-danger";
				}
			}
		}

		return retval;
	}.property("uiSaving", "uiSaveSuccess", "uiSaveFailure")

});

CERTApps.Team.reopenClass(
{
	lookup: function(teamID)
	{
		var settings = 
		{
			url: '/team',
			//type: 'json',
			dataType: 'json',
			method: 'get',
			data: 
			{
				team: teamID || 0
			}
		};

		console.log('get Team', settings)

		var a = $.ajax(settings);

		var t = a.then(function(data)
		{
			var teamData = CERTApps.moveUpData(data).Team;
			var team = CERTApps.Team.create(teamData);
			
			console.log("team, team.officers", team.toString(), team.get("officers"));

			return team;
		});

		return t;
	},

	sortOfficerDropDown: function(a, b) {
		return a.get("officerShortName") > b.get("officerShortName");
	}
});

CERTApps.MemberEvent = CERTApps.TimesObject.extend(
{
	value:  null,
	arriveTime: null,
	departTime: null,

	init: function()
	{
		console.group('CERTApps.MemberEvent init');
		this._super();
		
		this.parse();
		
		console.groupEnd();
	},

	defaults: function(ev)
	{
		console.group('CERTApps.MemberEvent defaults')

		console.log('MemberEvent', this);
		console.log('ev', ev);

		var startDB = this.dateBreakout(ev.EventStart);
		var finishDB = this.dateBreakout(ev.EventFinish);


		if( ! this.arriveTime )
		{
			if( startDB )
			{
				this.set('arriveTime', startDB.prettyTime);
			}
		}

		if( ! this.departTime )
		{
			if( finishDB )
			{
				this.set('departTime', finishDB.prettyTime);
			}
		}

		console.groupEnd();
	},

	parse: function()
	{
		console.group('CERTApps.MemberEvent parse');

		var arrive = this.get('Arrive');
		var depart = this.get('Depart');
		if( arrive )
		{
			var arriveDB = this.dateBreakout(arrive);
			console.log('arriveDB', arriveDB)
			this.set('arriveTime', arriveDB.prettyTime);
		}

		if( depart )
		{
			var departDB = this.dateBreakout(depart);
		}



		console.groupEnd();
	},

	save: function(ev)
	{
		console.group('CERTApps.MemberEvent save')

		console.log('Event, MemberEvent', ev, this)

		this.parseInputs(ev);

		var obj = 
			{
				Event: {KeyID: ev.KeyID},
				Response: this
			}

		var settings = 
			{
				url: '/response/save',
				type: 'json',
				dataType: 'json',
				data: JSON.stringify(obj),
				method: 'POST'
			};

		console.log('requesting data', settings)

		var a = $.ajax(settings);
		var t = a.then(function(obj)
		{ 
			var obj = this.moveUpData(obj); 

			return obj;
		}.bind(this));

		t.then(function(obj)
		{ 
			return obj;
		});

		console.groupEnd();

		return t;
	},

	parseInputs: function(ev)
	{
		console.group('CERTApps.MemberEvent parseInputs')

		console.log('this, ev', this, ev);

		switch(this.get('value'))
		{
			case 'Yes':
				this.set('Attending', true);
				this.set('Sure', true)
				break;
			case 'Maybe':
				this.set('Attending', true);
				this.set('Sure', false);
				break;
			case 'No':
				this.set('Attending', false);
				this.set('Sure', true);
				break;
		}

		var eventStart = ev.get('EventStart');
		var startDB = this.dateBreakout(eventStart);

		if( this.get('Attending') )
		{
			var arriveT = this.get('arriveTime');
			arriveT = arriveT.substring(0,2) + ':' + arriveT.substring(2) + ':00';
			var arriveStamp = eventStart.replace(startDB.hours + ':' + startDB.minutes + ':00', arriveT);

			var eventFinish = ev.get('EventFinish');
			var departT = this.get('departTime');
			departT = departT.substring(0,2) + ':' + departT.substring(2) + ':00';
			var departStamp = eventStart.replace(startDB.hours + ':' + startDB.minutes + ':00', departT);

			this.set('Arrive', arriveStamp);
			this.set('Depart', departStamp);
		}
		
		console.groupEnd();
	}
});

CERTApps.MemberEvent.reopenClass(
{
	lookup: function(responseID, ev)
	{
		console.group("CERTApps.MemberEvent.lookup");

		var settings = 
		{
			url: '/response',
			data: 
			{
				response: responseID || 0
			}
		};

		var a = CERTApps.ajax(settings);

		var t = a.then(function(data)
		{
			var dataObj = CERTApps.moveUpData(data);
			var retval = { Response: CERTApps.MemberEvent.create(dataObj.Response) };

			if( ev )
			{
				console.log('using real Event from caller');
				retval.Event = ev;
			} else
			{
				if( dataObj.Event )
				{
					console.log('using stub Event with ID only from JSON response');
					retval.Event = CERTApps.Event.create(dataObj.Event);
				}
			}

			console.log('CERTApps.MemberEvent.lookup returned', retval);
				
			return retval;
		});

		console.groupEnd();

		return t;
	}, 

	lookupByEvent: function(eventID)
	{
		console.group("lookupByEvent");

		var settings = 
		{
			url: '/response',
			//type: 'json',
			dataType: 'json',
			method: 'get',
			data: 
			{
				event: eventID || 0
			}
		};

		console.log('get Response', settings)

		var a = $.ajax(settings);

		var t = a.then(function(data)
		{
			var dataObj = CERTApps.moveUpData(data).Response;
			var retval = CERTApps.MemberEvent.create(dataObj);
			
			return retval;
		});

		console.groupEnd();

		return t;
	}
});

CERTApps.TeamIdEventsRoute = CERTApps.BaseRoute.extend(
{	
	actions:
	{
		userResponseForm: function(ev)
		{
			console.group('CERTApps.TeamIDEventsRoute.actions userResposne');

			console.log('ev', ev);

			this.transitionTo('response', {Event: ev});

			console.groupEnd();
		},

		eventEdit: function(ev)
		{
			console.group('CERTApps.TeamIDEventsRoute.actions eventEdit');

			console.log('ev', ev);
			var team = this.modelFor('team');

			this.transitionTo('event.update', team, {Event: ev});

			console.groupEnd();
		},

		sendReminders: function(ev)
		{
			console.group('CERTApps.TeamIDEventsRoute.actions eventEdit');

			console.log('ev', ev);
			var team = this.modelFor('team');

			ev.sendReminders(team);

			console.groupEnd();
		}
	},

	model: function(params)
	{
		console.group('CERTApps.TeamIDEventsRoute model')
		console.log('params', params);

		var team = this.modelFor('team');

		var obj = {
			KeyID: team.KeyID,
		};

		var settings = 
		{
			url: '/events',
			data: JSON.stringify(obj)
		};

		console.log('requesting data', settings)

		var a = CERTApps.ajax(settings);
		var t = a.then(
			function(obj)
			{ 
				obj = this.moveUpData(obj);
				//console.log('obj', obj);

				var events = this.parseEventsData(obj);

				return events;
			}.bind(this),
			function(xhr)
			{
				console.error(xhr);
			}.bind(this)
		);

		console.groupEnd();

		return t;
	},

	afterModel: function(model) {
		var team = this.modelFor('team');
		console.log('model, team', model, team);

		model.team = team;
	},

/*	setupController: function(controller, model)
	{
		console.group('CERTApps.TeamIDEventsRoute setupController')

		controller.set('model', model);

		console.log('controller, model', controller, model);
		console.groupEnd();

		return;		
	},
*/
	serialize: function(model)
	{
		console.group("CERTApps.TeamIDEventsRoute serialize");

		console.log('model', model);

		var e = model;
		if( model.Event ) e = model.Event;

		var obj = { eventID: e.get('KeyID') };

		console.groupEnd();

		return obj;
	},

	parseEventsData: function(obj)
	{
		console.group('CERTApps.TeamIDEventsRoute parseEventsData');
		console.log('obj', obj);

		var list = Ember.A([]);

		if( obj.Events) {
			for( var x = obj.Events.length - 1; x >= 0; x-- ) {
				var e = obj.Events[x];
				var ev = CERTApps.Event.create(e); 

				ev.parseDatesToJS();

				console.log('adding event to list', ev);

				list.pushObject(ev)
			}
		}
		
		var events = CERTApps.Events.create({events: list});

		console.log('TeamIDEventsRoute model returning', events); 

		this.parseResponses(events, obj.Responses);

		console.log('events after parseResponses', events);

		console.groupEnd();

		return events; 
	},

	parseResponses: function(events, responses)
	{
		console.group('CERTApps.TeamIDEventsRoute parseResponses');
		console.log('events, responses', events, responses);

		if( responses )
		{

			var lookup = {};

			events.events.forEach( 
				function(e)
				{
					var eventID = e.Key;
					lookup[eventID] = e;
					e.responses = Ember.A([]);

					console.log('added to lookup key', eventID, e);
				}.bind(this)
			);
			
			responses.forEach(
				function(r)
				{
					var eventID = r.EventKey;
					var ev = lookup[eventID];

					console.log('found event using key', eventID, ev);
					if( ev ) 
					{
						ev.responses.pushObject(r);
					} else
					{
						console.warn('No event found for Key from Response', eventID, r);
					}
				}.bind(this)
			);
		} else 
		{
			console.log('no responses found to parse');
		}

		console.groupEnd();
	}
});

CERTApps.ResponseIndexRoute = CERTApps.BaseRoute.extend(
{
	actions:
	{
		submitResponse: function(response)
		{
			console.group('CERTApps.ResponseIndexRoute.actions submitResponse')

			var ev = this.modelFor('eventID');

			if( ev.Event ) ev = ev.Event;

			console.log('response, ev', response, ev);

			var respObj = CERTApps.MemberEvent.create(response);

			var t = respObj.save(ev);

			console.groupEnd();

			return t;
		}
	},

	model: function(params, transition)
	{
		console.group('CERTApps.ResponseIndexRoute model');

		console.log('params, args', params, arguments);

		var e = this.modelFor('eventID');
		if( e.Event ) e = e.Event;
		var a = null;
		if( params.responseID )
		{
			console.log('looking up response for params', params, e);
			a = CERTApps.MemberEvent.lookup(params.responseID, e);

			a.then(function(obj){ console.log('CERTApps.ResponseIndexRoute model returning', obj)});
		} else {
			// for when you haven't passed a responseID on the URL
			
			if( ! e )
			{
				console.warn('Doing bad things using transition to get eventID model because modelFor returned null');

				if( transition )
				{
					e = transition.resolvedModels.eventID;
					console.log('got eventID from resolvedModels', e)
				} else
				{
					console.warn('transition was null');
				}
			}

			if( e )
			{
				if( e.Event ) e = e.Event;
				console.log('event, looking up response', e);

				a = CERTApps.MemberEvent.lookupByEvent(e.KeyID).then(function(data){ data = this.moveUpData(data); return data; }.bind(this));
			}
		}
		console.groupEnd();

		return a;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps.ResponseIndexRoute setupController')
		console.log('controller, model', controller, model);

		//if( model.Event ) model = model.Event;
		model = model || {};

		if( model.Response ) model = model.Response;
		
		if( Ember.typeOf(model) != 'instance' ) 
		{
			model = CERTApps.MemberEvent.create(model);
		}

		var ev = this.modelFor('event.ID');

		if( ev )
		{
			if( ev.Event ) ev = ev.Event;

			model.defaults(ev);
		} else
		{
			console.warn('ev was not found using modelFor eventID', ev)
		}

		console.log('setting model', model);
		controller.set('model', model);

		console.groupEnd();

		return;		
	},

	serialize: function(model)
	{
		console.group("CERTApps.ResponseIndexRoute serialize");

		console.log('model', model);

		var e = model;
		if( model.Event ) e = model.Event;

		var obj = { responseID: e.get('KeyID') };

		console.log('seralized to', obj);
		console.warn("but that ID's from an event not a response?", e);
		throw "Need to figure out how we get the response ID in here too, or do we not need it?, how smart did we make the response route"

		console.groupEnd();

		return obj;
	}
});

CERTApps.Events = CERTApps.BaseObject.extend({
	events: null,

	init: function()
	{
		events = Ember.A([]);
	},

	upcoming: function()
	{
		var now = Date.now();

		var list = Ember.A([]);

		var events = this.get('events');

		for( var x = events.length - 1; x >= 0; x-- )
		{
			var e = events[x];

			if( e.get('startTimestamp') > now )
			{
				//console.log('upcoming because',  e.get('startTimestamp'),' > ', now);
				list.pushObject(e);
			}
		}

		list.sort(this.sortByDate.bind(this));

		return list;

	}.property('events.@each.startTimestamp'),

	recent: function()
	{
		var now = Date.now();

		var list = Ember.A([]);

		var events = this.get('events');

		for( var x = events.length - 1; x >= 0; x-- )
		{
			var e = events[x];

			if( e.get('startTimestamp') < now )
			{
				console.log('recent because',  e.get('startTimestamp'),' < ', now);
				list.pushObject(e);
			}
		}

		list.sort(this.sortByDate.bind(this));

		return list;
	}.property('events.@each.startTimestamp'),

	sortByDate: function(a, b)
	{
		var aStamp = a.get('startTimestamp');
		var bStamp = b.get('startTimestamp');

		if( aStamp > bStamp )
		{
			return 1;
		} else if( bStamp > aStamp) 
		{
			return -1;
		}

		return 0;
	}
});

CERTApps.EventIDRoute = CERTApps.BaseRoute.extend(
{
	afterModel: function(model)
	{
		console.log('CERTApps.EventIDRoute afterModel', model, arguments)
		if( model.Event )
		{
		}
	},

	model: function(params)
	{
		var model = CERTApps.Event.lookup(params.eventID);

/*		var model = m.then(
		function(data)
			{
				console.log('m.then', data);

				data = this.moveUpData(data);

				var model = {Event: CERTApps.Event.create(data)};

				return model;
			}.bind(this)
		);
*/
		return model;
	},

	setupController: function(controller, model, transition)
	{
		console.log('CERTApps.EventIDRoute setupController', controller, model, transition);

		controller.set('model', model)
	},

	serialize: function(model)
	{
		console.group("CERTApps.EventIDRoute serialize");

		var m = model;
		if( model.Event ) m = model.Event;

		var obj = { eventID: m.get('KeyID') };

		console.log('model, serialized', model, obj);
		console.groupEnd();

		return obj;
	}
});

CERTApps.RadioButton = Ember.View.extend({  
	tagName : "input",
	type : "radio",
	attributeBindings : [ "name", "type", "value", "checked:checked:" ],
	click : function() {
		console.group('CERTApps.RadioButton click');

		var val = this.$().val();
		this.set("selection", val)

		console.groupEnd();
	},
	checked : function() {
    	return this.get("value") == this.get("selection");   
	}.property()
});

CERTApps.ResponseRadioButton = CERTApps.RadioButton.extend({  
	tagName : "input",
	type : "radio",
	attributeBindings : [ "name", "type", "value", "checked:checked:" ],
	click : function() {
		console.group('CERTApps.ResponseRadioButton click');

		this._super();

		var $ = this.$();

		var val = $.val();
		var form$ = $.closest('form');
		var details$ = form$.find('div.details');
		var button$ = form$.find('div.submit-response');
		var arrive$ = Ember.$(details$.find('input[name=arriveTime]')[0]);

		console.log('val, this, $', val, this, $);
		if( val === "Yes" || val === "Maybe") 
		{
			details$.slideDown();
			arrive$.focus();

		} else
		{
			details$.slideUp();
		}

		if( button$.find(":visible").length === 0 ) button$.slideDown()

		console.groupEnd();

		return true;
    },
});

CERTApps.DirectResponseIndexRoute = CERTApps.BaseRoute.extend(
{
	model: function(params, transition)
	{
		console.group('CERTApps.DirectResponseIndexRoute model');
	
		console.log('params', params);

		var a = CERTApps.MemberEvent.lookup(params.responseID, null);

		console.groupEnd()

		return a;
	},

	serialize: function(model)
	{
		console.group('CERTApps.DirectResponseIndexRoute serialize');
		
		var params = {responseID: model.get('KeyID')};

		console.log('params', params);

		console.groupEnd()
		
		return param;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps.DirectResponseIndexRoute setupController');

		console.log('model', model);
		this.transitionTo('response.index', model.Event.KeyID, model.Response);

		console.groupEnd();
	}
});

CERTApps.CertificationRoute = CERTApps.BaseRoute.extend(
{
	actions:
	{
		saveA: function(certification)
		{
			console.group("CERTApps.certificationRoute actions.saveA");

			console.log('certification', certification);

			var p = certification.save();

			p.then(
				function()
				{
					console.log("trainsitioning after saving certification", certification);
					this.transitionTo('certification.list', {queryParams: {last: certification.KeyID}});
					//this.transitionTo('certification.list');
				}.bind(this)
			);


			console.groupEnd();
		},

		saveTopicA: function(newTopic, model)
		{
			console.group("CERTApps.certificationRoute actions.saveTopicA");

			console.log('newTopic, certification', newTopic, model);

			var p = newTopic.save(model.certification.KeyID);

			p.then(
				function(obj)
				{					
					var topic = CERTApps.TrainingTopic.create(obj);

					model.topics.pushObject(topic)

					newTopic.reset();

					console.log("transitioning after saving topic", topic);

					this.transitionTo({queryParams: {lastTopic: topic.get('KeyID')}});
					//this.transitionTo('certification.list');
				}.bind(this)
			);


			console.groupEnd();
		},

		saveClass: function(newClass, certification, topics, model)
		{
			console.group("CERTApps.certificationRoute actions.saveClass");
			console.log('arguments', {newClass: newClass, certification: certification, topics: topics, team: team, model: model});

			var team = this.modelFor("team") || this.modelFor("application").get("Team");

			var p = newClass.save(team, certification);

			p.then(
				function(obj)
				{
					var classObj = CERTApps.CertificationClass.create(obj);

					model.classes.pushObject(classObj)

					newClass.reset(topics);

					window.setTimeout( function(){
						newClass.set("statuses.save", "done");
					},
					5000);

					//console.log("transitioning after saving topic", topic);

					//this.transitionTo({queryParams: {lastTopic: topic.get('KeyID')}});
					//this.transitionTo('certification.list');
				}.bind(this)
			);

			console.groupEnd();
		}

	},

	model: function(params, transition)
	{
		console.group('CERTApps.CertificationRoute model');
	
		console.log('params, transition', params, transition);

		console.groupEnd()

		return null;
	},

	serialize: function(model)
	{
		console.group('CERTApps.CertificationRoute serialize');
		
		var params = {responseID: model.get('KeyID')};

		console.log('params', params);

		console.groupEnd()
		
		return param;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps.CertificationRoute setupController');

		console.log('controller, model', controller, model);

		controller.set('model', model);

		console.groupEnd();
	}
});

CERTApps.Certification = CERTApps.BaseObject.extend(
{
	keyID: null,
	name: null,
	monthsValid: null,
	isLastEdited: null,

	
	init: function()
	{
		console.log('CERTApps.Certification init');
	},

	save: function(noTransition)
	{
		if( ! noTransition ) noTransition = false;

		console.group("CERTApps.Certification save");
		console.log('saving Certification', this);

		var settings = 
		{
			url: '/certification/save',
			type: 'json',
			dataType: 'json',
			data: JSON.stringify({ Certification: this })
		};

		console.log('requesting', settings)

		var a = $.ajax(settings);
		var t = a.then(function(data)
		{ 
			var obj = this.moveUpData(data); 

			return obj;
		}.bind(this));

		var p = t.then(function(data)
		{

			if( data.Certification )
			{
				console.log('syncing with', data.Certification);
				this.sync(data.Certification);
			} else
			{
				console.warn("Cannot sync when there's no Certification", data);
			}

			console.log('this after sync', this);

			return this;
		}.bind(this));

		console.groupEnd();

		return p;
	},

	monthsValidString: function(key, value, previousValue) 
	{
		// console.log('monthsValidString', arguments);
		if( arguments.length > 1 )
		{
			var intVal = parseInt(value);

			console.log('value, intVal', value, intVal);

			this.set('monthsValid', intVal);
		}

		return this.get('monthsValid');
	}.property('monthsValid'),

	neverBeenSaved: function() {
		var retval = true;

		var key = this.get("keyID");
		if( key && key !== 0 ) {
			retval = false;
		}

		return retval;
	}.property("keyID")
});

CERTApps.Certification.reopenClass(
{
	load: function(id)
	{
		console.group("CERTApps.Certification load");
		console.log('loading Certification', this);

		var settings = 
		{
			url: '/api/certification',
			method: "GET",
			data: "id=" + id
		};

		var a = CERTApps.ajax(settings);
		var p = a.then(function(data)
		{ 
			var obj = CERTApps.moveUpData(data); 

			return obj;
		}.bind(this));

		p2 = p.then(function(data)
		{
			var obj = CERTApps.Certification.parseJSON(data);

			console.log("CERTApps.Certification load.then returning", obj);

			return obj;
		}.bind(this),
		function(xhr)
		{
			console.error(xhr);
		}.bind(this));

		console.groupEnd();

		return p2;
	},

	parseJSON: function(data)
	{
		var obj = CERTApps.CertsTopicsClasses.create();

		if( data.Certification )
		{
			obj.certification = CERTApps.Certification.create(data.Certification);
		} else
		{
			console.warn("Data returned by server did not have Certification value");
		}

		if( data.Topics )
		{
			obj.topics = Ember.A([]);

			data.Topics.forEach( function(item)
			{
				if( item )
				{
					var tt = CERTApps.TrainingTopic.create(item);
					console.log('adding', tt);

					obj.topics.pushObject(tt);
				}
			});
		} else
		{
			console.info("Data returned by server did not have TrainingTopic value");
		}

		if( data.classes )
		{
			obj.classes.clear();

			data.classes.forEach(function(cData)
			{
				var c = CERTApps.CertificationClass.create(cData);

				obj.classes.pushObject(c);
			});
		} else
		{
			console.info("data returned by server did not have classes value");
		}

		return obj;
	},

	getAll: function()
	{
		console.group("CERTApps.Certification getAll");
		console.log('loading Certification', this);

		var settings = 
		{
			url: '/certifications/all',
			type: 'json',
			dataType: 'json',
			method: "GET"
		};

		console.log('requesting', settings)

		var a = $.ajax(settings);
		var p = a.then(function(data)
		{ 
			var obj = CERTApps.moveUpData(data); 

			return obj;
		}.bind(this));

		p2 = p.then(function(data)
		{
			var list = Ember.A([]);

			if( data.Certifications )
			{
				for( var x = data.Certifications.length - 1; x >= 0; x-- )
				{
					t = data.Certifications[x];
		
					var tObj = CERTApps.Certification.parseJSON(t);

					list.pushObject(tObj);
				}
			} else
			{
				console.warn("Data returned by server did not have Certifications value", data);
			}

			console.log("CERTApps.Certification load.then returning", list);

			return list;
		}.bind(this),
		function(xhr)
		{
			console.error(xhr);
		}.bind(this));

		console.groupEnd();

		return p2;
	}
});

CERTApps.CertsTopicsClasses = CERTApps.BaseObject.extend(
{
	topics: null,
	certification: null,
	classes: null,

	init: function()
	{
		this.set("classes", Ember.A([]));
	},

	sortedTopics: function()
	{
		var list = this.get("topics").sort(this.sortAsc.bind(this, "name"));

		console.log("sortedTopics", list);

		return list;
	}.property('topics.@each'),

	sortAsc: function(field, a, b)
	{
		if( a.get(field) > b.get(field) )
		{
			return 1;
		}

		return -1;
	},

	sortDesc: function(field, a, b)
	{
		return -this.sortAsc(field, a, b);
	}
});

CERTApps.CertificationTcreateRoute = CERTApps.BaseRoute.extend(
{
/*	model: function(params, transition)
	{
		console.group('CERTApps.CertificationCreateRoute model');
		console.log('params, transition', params, transition);

		var t = CERTApps.Certification.create();

		console.log('returning', t);
		console.groupEnd()

		return t;
	},
*/
	serialize: function(model)
	{
		console.group('CERTApps.CertificationCreateRoute serialize');
		
		var params = {responseID: model.get('KeyID')};

		console.log('params', params);
		console.groupEnd()
		
		return params;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps.CertificationCreateRoute setupController');

		var model = model || {};
		model.certification = CERTApps.Certification.create();
		model.newTopic = CERTApps.TrainingTopic.create({effectiveDate: moment()});

		console.log('controller, model', controller, model);
		controller.set('model', model);

		console.groupEnd();
	}
});

CERTApps.CertificationTupdateRoute = CERTApps.BaseRoute.extend(
{
	model: function(params, transition)
	{
		console.group('CERTApps.CertificationUpdateRoute model');
		console.log('params, transition', params, transition);

		var t = CERTApps.Certification.load(params.certificationID);

		t.then(function(obj)
		{
			console.log('CERTApps.CertificationUpdateRoute model.then', obj);

			return obj;
		});

		console.groupEnd()

		return t;
	},

	serialize: function(model)
	{
		console.group('CERTApps.CertificationUpdateRoute serialize');
		
		var params = {certificationID: model.certification.get('KeyID')};

		console.log('params', params);
		console.groupEnd()
		
		return params;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps.CertificationUpdateRoute setupController');
		console.log('controller, model', controller, model);

		model.newTopic = CERTApps.TrainingTopic.create({effectiveDate: moment()});
		model.newClass = CERTApps.CertificationClass.create();

		controller.set('model', model);

		console.groupEnd();
	}
});

CERTApps.CertificationListController = Ember.Controller.extend(
{
	queryParams: ['last'],
	last: null
});

CERTApps.CertificationListRoute = CERTApps.BaseRoute.extend(
{
	actions:
	{
		editA: function(certification)
		{
			console.group("CERTApps.CertificationListRoute actions.editA");
			console.log("certification", certification);

			this.transitionTo("certification.tupdate", certification);

			console.groupEnd();
		}, 

		createA: function()
		{
			console.groupCollapsed("CERTApps.CertificationListRoute actions.createA");

			this.transitionTo("certification.tcreate");

			console.groupEnd();
		}
	},

	model: function(params, transition)
	{
		console.group('CERTApps.CertificationListRoute model');
		console.log('params, transition', params, transition);

		var t = CERTApps.Certification.getAll();

		t.then(function(obj)
		{
			console.log('CERTApps.CertificationListRoute model.then', obj);

			return obj;
		});

		console.groupEnd()

		return t;
	},

	serialize: function(model)
	{
		console.group('CERTApps.CertificationListRoute serialize');
		
		var params = {certificationID: model.get('KeyID')};

		console.log('params', params);
		console.groupEnd()
		
		return params;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps.CertificationListRoute setupController');
		console.log('controller, model', controller, model);

		var lastID = 0;
		if( controller.last && controller.last.length > 0 )
		{
			lastID = parseInt(controller.last);
		}

		for( var x = model.length - 1; x >= 0; x-- )
		{
			var o = model[x].certification;

			console.log("o.KeyID, lastID, controller.last", o.KeyID, lastID, controller.last);
			if( o.KeyID === lastID )
			{
				o.set('isLastEdited', true);
			} else
			{
				o.set('isLastEdited', false);
			}
			console.log("isLastEdited", o.get("isLastEdited"));
		}

		controller.set('model', model);

		console.groupEnd();
	}
});

CERTApps.CertificationTupdateIndexRoute = CERTApps.BaseRoute.extend(
{
	actions:
	{
/*		editA: function(certification)
		{
			console.group("CERTApps.CertificationTopicRoute actions.editA");

			console.log("certification", certification);

			this.transitionTo("certification.tupdate", certification);

			console.groupEnd();
		}, 

		createA: function()
		{
			console.groupCollapsed("CERTApps.CertificationTopicRoute actions.createA");

			this.transitionTo("certification.tcreate");

			console.groupEnd();
		}
*/	},
	
	model: function(params, transition)
	{
		console.group('CERTApps.CertificationTupdateIndexRoute model');
		console.log('params, transition', params, transition);

		var certification = this.modelFor("certificationTupdate");

		console.log("ceritification", certification);

		//TODO load Offerings here, unless Offierings shouldn't go here
		var t = null; //CERTApps.TrainingTopic.getAll(certification.KeyID);

		console.groupEnd()

		return t;
	},

	serialize: function(model)
	{
		console.group('CERTApps.CertificationTopicRoute serialize');
		
		var params = {certificationID: model.get('KeyID')};

		console.log('params', params);
		console.groupEnd()
		
		return params;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps.CertificationUpdateRoute setupController');

		console.log('controller, model', controller, model);

		var lastID = 0;

		controller.set('model', model);

		console.groupEnd();
	}
});

CERTApps.TrainingTopic = CERTApps.BaseObject.extend(
{
	keyID: null,
	name: null,
	monthsValid: null,
	isLastEdited: null,

	effectiveDate: null,
	sunsetDate: null,

	included: true,
	
	init: function()
	{
		console.log('CERTApps.TrainingTopic init');
	},

	save: function(certificationID)
	{
		console.group("CERTApps.TrainingTopic save");
		console.log('saving TrainingTopic', this);

		this.set("effectiveDate", moment(this.get("effectiveDate")).format());
		if( this.get("sunsetDate") )
		{
			this.set("sunsetDate", moment(this.get("sunsetDate")).format());
		}

		var settings = 
		{
			url: '/api/trainingTopic/save',
			type: 'json',
			dataType: 'json',
			data: JSON.stringify({ TrainingTopic: this, Certification: { KeyID: certificationID } })
		};

		console.log('requesting', settings)

		var a = $.ajax(settings);
		var t = a.then(function(data)
		{ 
			var obj = this.moveUpData(data); 

			return obj;
		}.bind(this));

		var p = t.then(function(data)
		{

			if( data.TrainingTopic )
			{
				console.log('syncing with', data.TrainingTopic);
				this.sync(data.TrainingTopic);
			} else
			{
				console.warn("Cannot sync when there's no TrainingTopic", data);
			}

			console.log('this after sync', this);

			return this;
		}.bind(this));

		console.groupEnd();

		return p;
	},

	reset: function()
	{
		this.set("name", "");
		this.set("KeyID", 0);
	},

	effectiveDateMoment: function() {
		var parsed = moment(this.get("effectiveDate"));
		var retval = parsed.format("MM/DD/YY");

		if( parsed.year() == 0 )
		{
			retval = null;
		}
		return retval;
	}.property("effectiveDate"),

	sunsetDateMoment: function() {
		var parsed = moment(this.get("sunsetDate"));
		var retval = parsed.format("MM/DD/YY");

		if( ! parsed.isValid() || parsed.year() === 0)
		{
			retval = null;
		}
		return retval;	
	}.property("sunsetDate")

});

CERTApps.TrainingTopic.reopenClass(
{
	load: function(id)
	{
		console.group("CERTApps.TrainingTopic load");
		console.log('loading TrainingTopic', this);

		var settings = 
		{
			url: '/trainingTopic',
			type: 'json',
			dataType: 'json',
			method: "GET",
			data: { id: id }
		};

		console.log('requesting', settings)

		var a = $.ajax(settings);
		var p = a.then(function(data)
		{ 
			var obj = CERTApps.moveUpData(data); 

			return obj;
		}.bind(this));

		p2 = p.then(function(data)
		{
			var t = null;

			if( data.TrainingTopic )
			{
				t = CERTApps.TrainingTopic.create(data.TrainingTopic);
			} else
			{
				console.warn("Data returned by server did not have TrainingTopic value", data);
			}

			console.log("CERTApps.TrainingTopic load.then returning", t);

			return t;
		}.bind(this),
		function(xhr)
		{
			console.error(xhr);
		}.bind(this));

		console.groupEnd();

		return p2;
	},

	getAll: function(id)
	{
		console.group("CERTApps.TrainingTopic getAll");
		console.log('loading TrainingTopic', this);

		var settings = 
		{
			url: '/trainingTopics',
			type: 'json',
			dataType: 'json',
			method: "GET",
			data: {certificationsID: id}
		};

		console.log('requesting', settings)

		var a = $.ajax(settings);
		var p = a.then(function(data)
		{ 
			var obj = CERTApps.moveUpData(data); 

			return obj;
		}.bind(this));

		p2 = p.then(function(data)
		{
			var list = Ember.A([]);

			if( data.TrainingTopic )
			{
				for( var x = data.TrainingTopic.length - 1; x >= 0; x-- )
				{
					t = data.TrainingTopic[x];
					tObj = CERTApps.TrainingTopic.create(t);

					list.pushObject(tObj);
				}
			} else
			{
				console.warn("Data returned by server did not have TrainingTopic value", data);
			}

			console.log("CERTApps.TrainingTopic load.then returning", list);

			return list;
		}.bind(this),
		function(xhr)
		{
			console.error(xhr);
		}.bind(this));

		console.groupEnd();

		return p2;
	},
});

CERTApps.CertificationClassRoute = CERTApps.BaseRoute.extend(
{
	actions:
	{
		saveA: function(cClass)
		{
			console.group("CERTApps.CertificationClassRoute actions.saveA");

			var app = this.modelFor("application");
			var team = this.modelFor("team") || app.get("Team");

			var p = null;
			if( app )
			{
				console.log("cClass, team", cClass, team);

				p = cClass.save(team.get("KeyID"));

			} else
			{
				p = CERTApps.rejectRSVP("no model found for application")
			}


			p.then( 
			function(data)
				{	
					cClass.sync(data);
					this.transitionTo("certification.class.tupdate", {cClass: cClass});
				}.bind(this)
			);

			console.groupEnd();
		},

		editA: function(cClass)
		{
			console.group("CERTApps.CertificationClassRoute actions.editA");

			console.log("cClass", cClass);

			this.transitionTo("certification.class.tupdate", {cClass: cClass});

			console.groupEnd();
		}, 

		createA: function()
		{
			console.groupCollapsed("CERTApps.CertificationClassRoute actions.createA");

			this.transitionTo("certification.class.tcreate");

			console.groupEnd();
		},

		attendeeLookupA: function(attendee, cClass, attendees)
		{
			console.group("CERTApps.CertificationClassRoute actions.attendeeLookupA");

			console.log("attendee, cClass", attendee, cClass);

			var trackA = CERTApps.Attendee.create(attendee);

			cClass.searches.pushObject(trackA);

			var p = trackA.search();

			p.then(function(data)
			{

			},
			function(xhr, status, message)
			{
				// remove it?
				console.log("search.then arguments", arguments);

				if( Ember.$.isPlainObject(xhr) )
				{

				} else
				{
					if( typeof(xhr) === "string" )
					{
						var msg = xhr;

						if( msg === "No search value passed")
						{
							for( var x = cClass.searches.length - 1; x >= 0; x --)
							{
								var a = cClass.searches[x];

								a.unselect();
								if( Ember.$.trim(a.get("searchValue") === "" ))
								{
									cClass.searches.removeAt(x);
								}
							}
							return true;
						}
					}
				}
			}.bind(this));

			attendee.reset();

			console.groupEnd();
		},

		createAttendeeA: function(source, newMember, cClass)
		{
			console.group("CERTApps.CertificationClassRoute actions.createAttendeeA")
			console.log("source, newMember, cClass", source, newMember, cClass);
			console.log("arguments", arguments);
			console.groupEnd();
		},

		addAttendeeA: function(source, member, cClass, search)
		{
			console.group("CERTApps.CertificationClassRoute actions.addAttendeeA")
			console.log("source, member, cClass, search", source, member, cClass, search);
			
			cClass.addAttendee(member, search);

			console.groupEnd();			
		}

	},
});

CERTApps.CertificationClassIndexRoute = CERTApps.BaseRoute.extend(
{
	model: function(params, transition)
	{
		console.group('CERTApps.CertificationClassIndexRoute model');
		console.log('params, transition', params, transition);

		var app = this.modelFor("application");
		var team = this.modelFor("team") || app.get("Team");

		var p = CERTApps.CertificationClass.getAll(team.get("KeyID"));

		var p2 = p.then( function(obj)
		{
			var model =  {cClasses: obj};

			console.log('model', model);

			return model;
		});

		console.groupEnd()

		return p2;
	},

	serialize: function(model)
	{
		console.group('CERTApps.CertificationClassIndexRoute serialize');
		
		var params = {certificationID: model.get('KeyID')};

		console.log('params', params);
		console.groupEnd()
		
		return params;
	},

	setupController: function(controller, model)
	{
		console.group('CERTApps.CertificationClassIndexRoute setupController');

		console.log('controller, model', controller, model);

		var lastID = 0;

		controller.set('model', model);

		console.groupEnd();
	}
});

CERTApps.CertificationClass = CERTApps.BaseObject.extend(
{
	keyID: null,
	name: null,
	monthsValid: null,
	isLastEdited: null,

	attendees: null,
	searches: null,

	statuses: null,
	
	init: function()
	{
		console.log('CERTApps.CertificationClass init');

		if( this.get("attendees") == null ) this.set("attendees", Ember.A([]));
		this.set("searches", Ember.A([]));

		this.set("statuses", {});
	},

	save: function(team, certification)
	{
		console.group("CERTApps.CertificationClass save");
		console.log("this, team, certification",  this, team, certification);

		var teamID = team.get("KeyID");
		var certificationID = certification.get("KeyID");

		console.log('for teamID, certificatonID, saving CertificationClass', teamID, certificationID, this);

		var scheduled = this.get("scheduled")
		if(  scheduled && Ember.$.trim(scheduled) == "" ) this.set("scheduled", null);

		var p = null;
		if( teamID )
		{
			var t = CERTApps.ajax({
				url: '/api/certificationClass/save',
				data: { CClass: this, Team: { KeyID: teamID }, Certification: {KeyID: certificationID} }
			});
			p = t.then(function(data)
			{
				if( data.CClass )
				{
					console.log('syncing with', data.CClass);
					this.sync(data.CClass);
				} else
				{
					console.warn("Cannot sync when there's no CClass", data);
				}

				console.log('this after sync', this);

				return this;
			}.bind(this));
		} else
		{
			p = CERTApps.rejectRSVP("TeamID not passed to CERTApps.CertificationClass save")
		}
		console.groupEnd();

		return p;
	},

	reset: function()
	{
		this.set("name", "");
		this.set("KeyID", 0);
	},

	classNotSaved: function()
	{
		return ! (this.get("KeyID") && this.get("KeyID") > 0);
	}.property("KeyID"),

	scheduledDateOnly: function(key, value, prior)
	{
		// setter
		if( arguments.length > 1 )
		{
			console.log("scheduledDateOnly setter", key, value, prior);
			var dateVal = moment(value);
			this.set("scheduled", dateVal);
		}

		//getter

		var scheduled = this.get("scheduled");

		if(scheduled) 
		{
			var date = moment(scheduled);

			scheduled = date.format("YYYY-MM-DD");
		}

		return scheduled;

	}.property("scheduled"),

	scheduledDateOnlyDisp: function()
	{
		var scheduled = this.get("scheduled");

		if(scheduled) 
		{
			var date = moment(scheduled);

			scheduled = date.format("MM/DD/YYYY");
		}

		return scheduled;

	}.property("scheduled"),
	addAttendee: function(member, search)
	{
		console.group("CERTApps.CertificationClass addAttendee");
		console.log('adding Member to CertificationClass', member, this);

		var p = null;
		if( member )
		{
			var t = CERTApps.ajax({
				url: '/api/certificationClass/attendee/add',
				data: { CClass: { KeyID: this.get("KeyID")}, Member: { KeyID: member.get("KeyID") } }
			});

			p = t.then(function(data)
			{
				// if( data.CClass )
				// {
				// 	console.log('syncing with', data.CClass);
				// 	//this.sync(data.CClass);
				// } else
				// {
				// 	console.warn("Cannot sync when there's no CClass", data);
				// }

				//console.log('this after sync', this);

				this.attendees.pushObject(member);
				this.searches.removeObject(search);

				return this;
			}.bind(this));
		} else
		{
			p = CERTApps.rejectRSVP("Memer not passed to CERTApps.CertificationClass addAttendee")
		}
		console.groupEnd();

		return p;	
	},

	attendeesOrSearches: function()
	{
		var len = this.get("attendees").length + this.get("searches").length;
		console.log("len", len);
		return len > 0;
	}.property("attendees.length", "searches.length"),

	reset: function(topics) {
		this.set("name", null);
		this.set("scheduled", null);

		if( topics )
		{
			topics.forEach( function(t) {
				t.set("included", true);
			});
		}
	},

	certificationName: function() {
		return this.get("certification.name");
	}.property("certification.name")
});

CERTApps.getZeroPaddedDate = function(date)
{
	var retval = date.getFullYear() + "-";
	var month = (date.getMonth()+1) + ""
	var dateNum = date.getDate() + "";

	if( month.length = 1)
	{
		month = "0" + month;
	}
	if( dateNum.length = 1)
	{
		dateNum = "0" + dateNum;
	}

	retval += month + "-" + dateNum;

	return retval;
}

CERTApps.getDateAndTimeFormatted = function(datePart, timePart)
{
	var toParse = datePart;
	if( timePart ) 
	{
		toParse += "T" + timePart;
	}

	var dateObj = new Date(Date.parse(toParse));
	var offsetHours = dateObj.getTimezoneOffset()/60;
	var retval = datePart + 'T' + timePart + '-0' + offsetHours + ':00';

	return retval;
};

CERTApps.ajax = function(options) {
	var t = null;

	if( options.url ) {
		options.dataType = options.dataType || "json";
		options.type = options.type || "post";
		options.cache = options.cache || false;
		options.contentType = options.contentType || "application/json; charset=utf-8";	

		if( options.data ) {
			if( options.type.toLowerCase() == "post" ) {
				if( $.isPlainObject(options.data)) {
					options.data = JSON.stringify(options.data);
				} else {
					if( Ember.typeOf(options.data) === "instance" ) {
						console.error("options.data needs to have named sub-objects not a single entity passed with no name, etc");
					}
				}
			}
		}

		console.log('requesting', options)

		var a = $.ajax(options);
		t = a.then(function(data) { 
			var obj = this.moveUpData(data); 

			return obj;
		}.bind(this), function(xhr, textStatus, error) {
			console.error("ajax request failed", textStatus, error, {error: error, options: options, xhr: xhr} );

			return true;
		}.bind(this)
		);
	} else {
		var msg ="Must provide options.url when calling CERTApps.ajax";
		t = CERTApps.rejectRSVP(msg);
		console.error(msg);
	}

	return t;
};

CERTApps.ajaxError = function(xhr, status, msg)
{
	console.error("AJAX error", status, msg, xhr, this);
}

CERTApps.rejectRSVP = function(message)
{
	var p = new Ember.RSVP.Promise(function(resolve, reject) {
	  reject(message);
	});

	return p;
};

CERTApps.CertificationClass.reopenClass(
{
	load: function(id)
	{
		console.group("CERTApps.CertificationClass load");
		console.log('loading CertificationClass', this);

		var p = CERTApps.ajax( 
			{
				type: "get",
				data: { id: id },
				url: '/api/certificationClass'
			}
		);
		
		p2 = p.then(function(data)
		{
			var t = null;

			if( data.CertificationClass )
			{
				t = CERTApps.CertificationClass.create(data.CertificationClass);
			} else
			{
				console.warn("Data returned by server did not have CertificationClass value", data);
			}

			console.log("CERTApps.CertificationClass load.then returning", t);

			return t;
		}.bind(this),
		function(xhr)
		{
			console.error(xhr);
		}.bind(this));

		console.groupEnd();

		return p2;
	},

	getAll: function(teamID)
	{
		console.group("CERTApps.CertificationClass getAll");
		console.log("loading CertificationClass", this);

		var p = CERTApps.ajax({
			type: "get",
			url: "/api/certificationClass/all",
			data: {teamID: teamID}
		});

		p2 = p.then(function(data)
		{
			var list = Ember.A([]);
			var map = {};

			if( data.Certifications ) {				
				data.Certifications.forEach( function(certData){
					var cert = CERTApps.Certification.create(certData);

					map[cert.get("Key")] = cert;
				});
			}
			
			if( data.CClasses )
			{
				for( var x = data.CClasses.length - 1; x >= 0; x-- )
				{
					t = data.CClasses[x];
					tObj = CERTApps.CertificationClass.create(t);

					var cert = map[tObj.get("CertificationKey")];

					tObj.set("certification", cert);

					list.pushObject(tObj);
				}
			} else
			{
				console.warn("Data returned by server did not have CClasses value", data);
			}

			console.log("CERTApps.CertificationClass load.then returning", list);

			return list;
		}.bind(this),
		function(xhr)
		{
			console.error(xhr);
		}.bind(this));

		console.groupEnd();

		return p2;
	}
});

CERTApps.CertificationClassIndexController = Ember.Controller.extend(
{
	queryParams: ['lastClass'],
	lastClass: null
});

CERTApps.CertificationTupdateIndexController = Ember.Controller.extend(
{
	queryParams: ['lastTopic'],
	lastTopic: null
});

CERTApps.EventCreateView = Ember.View.extend(
{
	templateName: 'event/update'
});

CERTApps.CertificationTcreateView = Ember.View.extend(
{
	templateName: 'certification/tupdate'
});

CERTApps.CertificationClassTcreateView = Ember.View.extend(
{
	templateName: 'certification/class/tupdate'
});

CERTApps.CertificationClassTcreateRoute = CERTApps.BaseRoute.extend(
{
	model: function(params)
	{
		var model = { cClass: CERTApps.CertificationClass.create() };

		console.log('CERTApps.CertificationTCreateRoute.model, params', model, params)
		return model;
	}
});

CERTApps.CertificationClassTupdateRoute = CERTApps.BaseRoute.extend(
{
	model: function(params)
	{
		console.group("CERTApps.CertificationClassTupdateRoute model");
		console.log('params', params);

		var p = CERTApps.CertificationClass.load(params.cClassID);
		
		var p2 = p.then( function(obj)
		{
			var model = { cClass: obj };

			console.log('CERTApps.CertificationClassTupdateRoute.model, params', model, params)
			return model;
		});

		console.groupEnd();

		return p2;
	},

	serialize: function(model)
	{
		console.group('CERTApps.CertificationClassTupdateRoute serialize');
		
		var params = {cClassID: model.cClass.get('KeyID')};

		console.log('params', params);

		console.groupEnd()
		
		return params;
	},

	afterModel: function(model)
	{
		console.log("afterModel adding newAttendee");
		model.newAttendee = CERTApps.Attendee.create();
		return model;
	},
});

CERTApps.Attendee = CERTApps.BaseObject.extend(
{	
	searchValue: null,
	potentialMatches: null,
	selected: false,

	searching: true,

	init: function()
	{
		console.log('CERTApps.Attendee init');

		this.set("potentialMatches", Ember.A([]));
		this.set("newMember", CERTApps.Member.create({hideSave: true}));
	},

	reset: function()
	{
		this.set("searchValue", "");
		this.set("KeyID", 0);
	},

	select: function()
	{
		this.set("selected", true);
	},

	unselect: function()
	{
		this.set("selected", false);
	},

	search: function()
	{
		var rawValue = this.get("searchValue");
		var p = null;

		console.log("rawValue", rawValue);

		if( rawValue ) {
			var values = this.getSearchValues(rawValue);

			p = this.doSearch(values);
		} else {
			p = CERTApps.rejectRSVP("No search value passed");
		}
		
		return p;
	},

	doSearch: function(values)
	{
		console.group("CERTApps.Attendee search");
		this.set("searchData", values);

		p = CERTApps.ajax({
			url: "/api/member/search",
			data: values
		});
	
		console.groupEnd();

		p.then(
			function(obj)
			{
				var pm = this.get('potentialMatches');
				var noMatches = false;

				pm.clear();

				if( obj.Members ) {
					if( obj.Members.length > 0 ) {
						obj.Members.forEach(function(item)
						{
							var mem = CERTApps.Member.create(item);
							pm.pushObject(mem);
						});
					} else { 
						noMatches = true;
					}
				} else {
					noMatches = true;
				}

				this.toggleProperty("searching");
				this.select();

			}.bind(this),
				CERTApps.ajaxError.bind(this)
			);
		return p;
	},

	getSearchValues: function(rawValue)
	{
		console.group("CERTApps.Attendee getSearchValues");

		var values = { adjusted: false };

		values.phone = this.getPhone(rawValue);
		if( ! values.phone ) 
		{
			values.nameOrEmail = this.getNameOrEmail(rawValue);
		}

		console.log("values", values);
		console.groupEnd();

		return values;
	},

	getPhone: function(rawValue)
	{
		console.group("CERTApps.Attendee getPhone");
		console.log("rawValue", rawValue);

		var phone = null;
		var numbersOnly = Ember.A([]);
		var notAPhone = false;

		for( var x = rawValue.length - 1; x >=0; x-- )
		{
			var item  = rawValue[x];
			console.log("for rawValue", item);

			if( 
				item !== "-"
				&& item !== " "
				&& item !== "("
				&& item !== ")"
			) {
				if( Ember.$.isNumeric(item) )
				{
					console.log("number", item);
					numbersOnly.unshift(item);
				} else {
					console.log("not a number, dash, (), or space, returning", item);
					notAPhone = true;
					return;
				}
			} else
			{
				console.log("phone number piece, but not number", item);
			}
		}

		console.log("notAPhone", notAPhone);
		if( notAPhone == false )
		{
			phone = numbersOnly.join("");
		}

		console.log('returning', phone);

		console.groupEnd();

		return phone;
	},

	getNameOrEmail: function(rawValue)
	{
		console.group("CERTApps.Attendee getNameOrEmail");
		console.log("rawValue", rawValue);

		var nameOrEmail = null;
		
		// should we chop off the last char to make > search work, or should we just use >
		// if( rawValue.length > 1 )
		// {
		// 	nameOrEmail = rawValue.substring(0, rawValue.length - 1);
		// } else
		// {
		// 	nameOrEmail = rawvalue;
		// }

		nameOrEmail = rawValue;

		console.log('returning', nameOrEmail);

		console.groupEnd();

		return nameOrEmail;
	}
});	

CERTApps.CreateMemberButtonView = Ember.Component.extend({
	layoutName: "createMemberButton",

	click: function(evt) {
		console.group("CERTApps.CreateMemberButtonView click");
		
		console.log("evt", evt);
		console.log("arguments", arguments);
		console.log("this", this);

		var target$ = $(evt.target)
		var memberForm$ = target$.parent().parent().find(".js-create-member");

		memberForm$.slideDown()
		
		console.groupEnd();
	}
});

CERTApps.MemberEditComponent = Ember.Component.extend({
	actions: {
		saveContact: function(member, team) {
			console.group('CERTApps.MemberRoute actions.saveContact');
			console.log('member, args', member, arguments);

			var p = member.save(team);

			p.then( function(data) {
				console.log("will clear save icon in 5 seconds");
				window.setTimeout( function() { 
					member.set("statuses.save", "done"); 
				}, 
				5000);
			});

			console.groupEnd();
		}
	}
});

CERTApps.TeamIdComfortStationCreateView = Ember.View.extend(
{
	templateName: 'team/id/comfortStation/update'
});

CERTApps.TeamIdComfortStationRoute = CERTApps.BaseRoute.extend(
{
	actions:
	{
		createComfortStation: function()
		{
			console.group("CERTApps.TeamIdComfortStationRoute.actions createComfortStation")
			var team = this.modelFor("team");
			console.log("transitioning with", team);
			this.transitionTo("team.id.comfortStation.create", team);

			console.groupEnd();
		},

		editComfortStation: function(station)
		{
			console.group("CERTApps.TeamIdComfortStationRoute.actions editComfortStation")
			var team = this.modelFor("team");
			console.log("transitioning with", team, station);
			this.transitionTo("team.id.comfortStation.update", team, {station: station});

			console.groupEnd();
		},

		saveComfortStation: function(station, team)
		{
			console.group("CERTApps.TeamIdComfortStationRoute.actions createComfortStation")
			console.log("station, team", station, team);

			var teamID = team.get("KeyID");
			var p = station.save(teamID);

			p.then(function saveComfortStationThen() {
				this.send("editComfortStation", station);
			}.bind(this)
			);

			console.groupEnd();
		}
	}
});

CERTApps.TeamIdComfortStationCreateRoute = CERTApps.BaseRoute.extend(
{
	model: function(params)
	{
		var model = { station: CERTModels.ComfortStation.create() };

		console.log('CERTApps.TeamIdComfortStationCreateRoute.model, params', model, params);
		return model;
	},

	afterModel: function(model)
	{
		console.group("CERTApps.TeamIdComfortStationCreateRoute afterModel");

		var team = this.modelFor('team');
		model.team = team;

		model.station = CERTModels.ComfortStation.create({city: team.city, state: team.state, zip: team.zip});

		console.log('model', model);
		console.groupEnd();

		return model;
	}
});

CERTApps.TeamIdComfortStationUpdateRoute = CERTApps.BaseRoute.extend(
{
	model: function(params)
	{
		console.group("CERTApps.TeamIdComfortStationUpdateRoute model");
		console.log('params', params);

		var model = {station: null};
		var p = CERTModels.ComfortStation.fetch(params.stationID);
			
		var p2 = p.then( function(obj) {
			if( obj ) {
				if( obj.station ) {
					model.station = CERTModels.ComfortStation.create(obj.station);
				} else {
					console.error("No station object ComfortStation.fetch");
				}
			} else {
				console.error("Nothing data from ComfortStation.fetch");
			}

			console.log('CERTApps.TeamIdComfortStationUpdateRoute.model, params', model, params);
			return model;
		});

		console.groupEnd();

		return p2;
	},

	afterModel: function(model)
	{
		console.group("CERTApps.TeamIdComfortStationUpdateRoute afterModel");

		var team = this.modelFor('team');
		model.team = team;

		console.log('model', model);
		console.groupEnd();

		return model;
	},

	serialize: function(model)
	{
		console.group('CERTApps.TeamIdComfortStationUpdateRoute serialize');
		
		var params = {stationID: model.station.get('KeyID')};

		console.log('params', params);

		console.groupEnd()
		
		return params;
	},
});

CERTApps.TeamIdComfortStationListRoute = CERTApps.BaseRoute.extend(
{
	model: function(params)
	{
		console.group("CERTApps.TeamIdComfortStationListRoute model");
		console.log('params', params);

		var team = this.modelFor('team');

		var p = CERTModels.ComfortStation.fetchForTeam(team.get("KeyID"));
		
		var p2 = p.then( function(obj)
		{
			var model = { locations: Ember.A([]) };

			if( obj ) {
				if( obj.locations )
				{
					obj.locations.forEach(function comfortStationListRouteModelForEach(obj) {
						var cs = CERTModels.ComfortStation.create(obj);

						model.locations.pushObject(cs);
					}.bind(this)
					);
				}
			}
			console.log('CERTApps.TeamIdComfortStationListRoute.model, params', model, params)
			return model;
		});

		console.groupEnd();

		return p2;
	},

	afterModel: function(model)
	{
		console.group("CERTApps.TeamIdComfortStationListRoute afterModel");

		var team = this.modelFor('team');
		model.team = team;

		console.log('model', model);
		console.groupEnd();

		return model;
	},

	serialize: function(model)
	{
		console.group('CERTApps.TeamIdComfortStationListRoute serialize');
		
		var params = {teamID: model.Team.get('KeyID')};

		console.log('params, model', params, model);
		console.groupEnd()
		
		return params;
	},
});

CERTModels.ComfortStation = CERTApps.BaseObject.extend(
{	
	init: function()
	{
		console.log('CERTModels.ComfortStation init');
	},


	reset: function()
	{
		//console.log('CERTModels.ComfortStation init');

		this.set("KeyID", 0);
	},

	save: function(teamID)
	{
		console.group("CERTModels.ComfortStation save");

		var key = this.get("KeyID") || ""

		var options =  {
			url: "/api/comfort-station/" + key,
			data: {Station: this, Team: {KeyID: teamID}}
		};

		var p = CERTApps.ajax(options);

		var o = p.then(function comfortStationSaveSuccess(obj) {
			console.group("CERTModels.ComfortStation comfortStationSaveSuccess");

			this.sync(obj.Station);

			console.groupEnd();

			return this;

		}.bind(this)
		);

		return o;
	},

	line2Display: function()
	{
		return CERTModels.line2Display(this);
	}.property("line2")
});	

CERTModels.ComfortStation.reopenClass(
{
	fetch: function(stationID)
	{
		console.group("CERTModels.ComfortStation.fetch")
		console.log("stationID", stationID);

		var options = 
		{
			url: "/api/comfort-station/" + stationID,
			type: "get"
		};

		var t = CERTApps.ajax(options);

		return t;
	},

	fetchForTeam: function(teamID)
	{
		console.group("CERTModels.ComfortStation.fetchForTeam")
		console.log("teamID", teamID);

		var options = 
		{
			url: "/api/comfort-stations/" + teamID,
			type: "get"
		};

		var t = CERTApps.ajax(options);

		return t;
	}
});

CERTApps.TeamEditComponent = Ember.Component.extend({
	actions: {
		saveTeam: function(team) {
			console.group('CERTApps.TeamEditComponent actions.saveTeam');
			console.log('team', team);

			var p = team.save()

			p.then(
				function(){
					window.setTimeout(
						function() {
							team.set("uiStatuses.saving", "done");
						},
						5000
					);
			});

			console.groupEnd();
		}
	}
});

CERTApps.MemberCreateView = Ember.View.extend({
	templateName: 'member/update'
});

CERTApps.MemberCreateRoute = Ember.Route.extend({
	setupController: function(controller, model) {
		console.group('CERTApps.MemberCreateRoute setupController')

		var team = this.modelFor("application").Team;
		var data = {
			city: team.get("city"),
			state: team.get("state"),
			zip: team.get("zip"),
			active: true,
			enabled: true,
		};

		console.log("data, team", data, team);

		model = { member: CERTApps.Member.create(data), team: team };

		console.log("model", model);

		controller.set("model", model);

		console.groupEnd();

		return model;
	},
});

CERTApps.MemberEditView = Ember.View.extend({
	templateName: 'member/update'
});

CERTApps.MemberEditRoute = Ember.Route.extend({

	model: function(params) {
		console.group('CERTApps.MemberEditRoute setupController')
		console.log("params", params)

		var p = CERTApps.Member.lookup(params.memberID);

		var t = p.then( function(data) {
			var memberData = data.Member;
			var model = {
				member: CERTApps.Member.create(memberData)
			};

			return model;
		});
		console.groupEnd();

		return t;
	},

	setupController: function(controller, model) {
		console.group('CERTApps.MemberEditRoute setupController')

		var appModel = this.modelFor("application");

		model = { 
			member: model,
			team: appModel.get("Team"),
			loggedInMember: appModel.get("Member")
		};

		console.log("model", model);

		controller.set("model", model);

		console.groupEnd();

		return model;
	},

	serialize: function(model) {
		console.group("CERTApps.MemberEditRoute serialize");
		console.log("model, this", model, this);

		return {memberID: model.KeyID};

		console.groupEnd();

	}
});

CERTApps.Where = CERTApps.BaseObject.extend({
	name: null,
	lat: null,
	long: null,
	entered: null,

	include: true,
	
	init: function() {
		this.set("include", true);
	},

	enteredMoment: function()
	{
		return moment(this.get("entered"));
	}.property("entered"),

	enteredRelativeDate: function()
	{
		return this.get("enteredMoment").fromNow();
	}.property("enteredMoment"),

	toggleText: function() {
		var retval = "Including";

		if( this.get("include") == false ) {
			retval = "Excluding";
		}

		return retval;
	}.property("include")

});
CERTApps.Where.reopenClass(
{
	lookup: function(params)
	{
		console.group("CERTApps.Where.lookup");
		console.log("params");
/*		var options = {
			url: "/api/where/lookup"
		};

		var p = CERTApps.ajax(options);

		var t = p.then( function(data)
		{
			return CERTApps.moveUpData(data);
		});
*/
		var p = gapiPromise.then( function() {
			var t = gapi.client.where.list();

			var t2 = t.then(function(data) {
				console.log("t2 then", data);
				var results = CERTApps.WhereResults.create();

				if( data.result.entries ) {
					for(var i = data.result.entries.length - 1; i >= 0; i-- ) {
						var item = data.result.entries[i];
						var e = CERTApps.Where.create(item);

						results.entries.pushObject(e);
					}
				}

				return results;
			});
			
			return t2;
		});

		console.groupEnd();

		return p;
	}
});

CERTApps.WhereResults = CERTApps.BaseObject.extend({
	entries: null,
	filterNames: null,
	nameList: null,
	mostRecent: true,
	markers: null,
	map: null,

	latLngBounds: null,

	init: function() {
		this.set("entries", Ember.A([]));
		this.set("nameList", Ember.A([]));
		this.set("filterNames", Ember.A([]));
		this.set("markers", Ember.A([]));
	},

	entriesSorted: function() {
		return this.get("entriesFiltered");
	}.property("entriesFiltered.@each"),

	entriesFiltered: function() {
		console.group("entriesFiltered");

		var list = this.get("entries");
		var filtered = Ember.A([]);

		var names = this.get("nameList");
		names.clear();
		var namesMap = {};

		console.groupCollapsed("list.forEach");
		list.forEach( function(item) {
			console.log("item", item);

			if( ! namesMap[item.name] ) {
				namesMap[item.name] = item;

				names.pushObject(item)
			} else {
				var old = namesMap[item.name];
				if( item.get("enteredMoment").diff(old.get("enteredMoment")) > 0 )
				{
					console.log("newer item found replacing", item, old);
					namesMap[item.name] = item;
				}
			}
		});
		console.groupEnd();

		var namesListMap = {};
		names.forEach( function(item) {
			namesListMap[item.name] = item;
		});

		console.groupCollapsed("list.forEach for exclude");
		var exclude = this.get("exclude");
		list.forEach( function(item) {
			console.log("item", item);

			var name = item.get("name");
			var referencePerson = namesListMap[name];

			item.set("include", referencePerson.get("include"));
			console.log("checked if name is excluded", name, referencePerson.get("include"), item.get("include"));
		});
		console.groupEnd();
		//throw ("this works for single records, not for multiples");

		names.sort(function (a,b) {
			return a.name > b.name;
		});

		if( this.get("mostRecent") ) {
			for( var i in namesMap )
			{
				var item = namesMap[i];
				filtered.pushObject(item);
			}
		} else {
			filtered = this.get("entries");
		}

		var included = filtered.filterBy("include", true)

		console.log("filtered", filtered);
		console.log("included", included);

		console.groupEnd();
		return included;
	}.property("entries.@each.include", "mostRecent"),

	setMarkers: function() {
		console.group("CERTApps.WhereResults setMarkers");

		var filtered = this.get("entriesFiltered");
		var map = this.get("map");
		var markers = this.get("markers");

		// clear the existing markers
		markers.forEach(function(marker) {
			console.log("markers.forEach marker", marker);
			marker.setMap(null);
		});

		markers.clear();

		filtered.forEach(function(item) {
			console.log("filtered.forEach item", item);

			pos = {lat: item.lat, lng: item.long};
	    	title = item.get("name") + " - " + item.get("enteredRelativeDate");

	    	console.log('putting item on map', pos, item);

	    	var icon = "//www.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png";

	    	if( !item.get("active") ) icon = "//www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png";
			if( item.get("Officer") ) icon = "//www.google.com/intl/en_us/mapfiles/ms/micons/grn-pushpin.png";

			var marker = new google.maps.Marker({
				position: pos,
				map: map,
				animation: google.maps.Animation.DROP,
				icon: icon,
				title: title
			});

			console.log("adding marker to list", marker);
			markers.pushObject(marker);
		});

		var maxLat = -300;
		var minLat = 300;
		var maxLong = -300;
		var minLong = 300

		markers.forEach(function(item){
			console.log("included.forEach item", item);
			var pos = item.position;

			if( pos.lat() > maxLat ) {
				maxLat = pos.lat();
			}

			if( pos.lat() < minLat ) {
				minLat = pos.lat();
			}

			if( pos.lng() > maxLong ) {
				maxLong = pos.lng();
			}

			if( pos.lng() < minLong ) {
				minLong = pos.lng();
			}
		});

		console.log("sw", minLat, minLong);
		console.log("ne", maxLat, maxLong);
		var sw = new google.maps.LatLng(minLat, minLong);
		var ne = new google.maps.LatLng(maxLat, maxLong);
		this.set("latLngBounds", new google.maps.LatLngBounds(sw, ne));

		console.groupEnd();
	}.observes("entriesFiltered.@each")
});

CERTApps.WhereRoute = CERTApps.BaseRoute.extend({
	actions: {
		toggleInclude: function(person) {
			console.group("CERTApps.WhereRoute actions.toggleInclude");

			person.toggleProperty("include");
			
			console.groupEnd();
		}
	},

	model: function(params)
	{
		console.group("CERTApps.WhereRoute model");
		console.log("params", params);

		var p = CERTApps.Where.lookup();

		console.groupEnd();
		return p;
	},

	// model: function(params)
	// {
	// 	console.group("CERTApps.TeamIdComfortStationListRoute model");
	// 	console.log('params', params);

	// 	var team = this.modelFor('team');

	// 	var p = CERTModels.ComfortStation.fetchForTeam(team.get("KeyID"));
		
	// 	var p2 = p.then( function(obj)
	// 	{
	// 		var model = { locations: Ember.A([]) };

	// 		if( obj ) {
	// 			if( obj.locations )
	// 			{
	// 				obj.locations.forEach(function comfortStationListRouteModelForEach(obj) {
	// 					var cs = CERTModels.ComfortStation.create(obj);

	// 					model.locations.pushObject(cs);
	// 				}.bind(this)
	// 				);
	// 			}
	// 		}
	// 		console.log('CERTApps.TeamIdComfortStationListRoute.model, params', model, params)
	// 		return model;
	// 	});

	// 	console.groupEnd();

	// 	return p2;
	// },

	afterModel: function(model)
	{
		console.group("CERTApps.WhereRoute afterModel");

		var team = this.modelFor('team');
		model.team = team;

		console.log('model', model);
		console.groupEnd();

		return model;
	},

	// serialize: function(model)
	// {
	// 	console.group('CERTApps.WhereRoute serialize');
		
	// 	var params = {teamID: model.team.KeyID};
		
	// 	console.log('params, model', params, model);
	// 	console.groupEnd()
	// 	return params;
	// },
});

CERTApps.WhereView = Ember.View.extend(
{
	didInsertElement: function()	
	{
		console.group('CERTApps.WhereView didInsertElement');
		console.log('arguments', arguments);
		console.log('this', this);

        var mapOptions = {
          mapTypeId: google.maps.MapTypeId.ROADMAP
        }

        var mapCanvas = $('#' + this.elementId).find('.map-canvas')[0];
        var model = this.get("controller.model");
        console.log("forcing call to setMarkers")
        model.setMarkers();
        var map = this.get("controller.model.map");

        if( ! map ) {
        	map = new google.maps.Map(mapCanvas, mapOptions);
	        this.set("controller.model.map", map);
        }
        var markers = this.get("controller.model.markers");

        if( markers )
        {
	        markers.forEach(function(marker){
	        	console.log("setting marker map now that map is inserted");
	        	marker.setMap(map);
	        });
        }
        
        map.fitBounds(this.get("controller.model.latLngBounds"));

        console.groupEnd();
    }
});
