morpheus.LandingPage = function(pageOptions) {
	pageOptions = $.extend({}, {
		el : $('#vis')
	}, pageOptions);
	this.pageOptions = pageOptions;
	var _this = this;

	var $el = $('<div class="container" style="display: none;"></div>');
	this.$el = $el;
	var html = [];
	html.push('<div name="help" class="pull-right"></div>');

	html
			.push('<div style="margin-bottom:10px;"><img src="//www.broadinstitute.org/cancer/software/morpheus/images/icon.svg" alt="logo" /> <span style="font-size:16px;font-family:Roboto,sans-serif;">Morpheus</span></div>');

	html.push('<h4>Open your own file</h4>');
	html.push('<div name="formRow" class="center-block"></div>');
	html.push('<h4>Or select a preloaded dataset</h4>');
	html.push('<div name="exampleRow"></div>');
	html.push('</div>');
	$(html.join('')).appendTo($el);

	new morpheus.HelpMenu().$el.appendTo($el.find('[name=help]'));
	var formBuilder = new morpheus.FormBuilder();
	formBuilder.append({
		name : 'file',
		showLabel : false,
		value : '',
		type : 'file',
		required : true,
		help : morpheus.DatasetUtil.DATASET_FILE_FORMATS
	});
	formBuilder.$form.appendTo($el.find('[name=formRow]'));
	this.formBuilder = formBuilder;
	this.$sampleDatasetsEl = $el.find('[name=exampleRow]');

};

morpheus.LandingPage.prototype = {
	dispose : function() {
		this.formBuilder.setValue('file', '');
		this.$el.hide();
		$(window)
				.off(
						'paste.morpheus drop.morpheus dragover.morpheus dragenter.morpheus beforeunload.morpheus');
		$(window).on('beforeunload.morpheus', function() {
			return 'Are you sure you want to close Morpheus?';
		});
		this.formBuilder.off('change');
	},
	show : function() {
		var _this = this;
		if (!this.sampleDatasets) {
			this.sampleDatasets = new morpheus.SampleDatasets({
				$el : this.$sampleDatasetsEl,
				callback : function(heatMapOptions) {
					_this.open(heatMapOptions);
				}
			});
		}

		this.$el.show();

		this.formBuilder.on('change', function(e) {
			var value = e.value;
			if (value !== '' && value != null) {
				_this.openFile(value);
			}
		});
		$(window).on('paste.morpheus', function(e) {
			var text = e.originalEvent.clipboardData.getData('text/plain');
			if (text != null && text.length > 0) {
				var blob = new Blob([ text ]);
				var url = window.URL.createObjectURL(blob);
				e.preventDefault();
				e.stopPropagation();
				_this.openFile(url);
			}
		}).on('dragover.morpheus dragenter.morpheus', function(e) {
			e.preventDefault();
			e.stopPropagation();
		}).on(
				'drop.morpheus',
				function(e) {
					if (e.originalEvent.dataTransfer
							&& e.originalEvent.dataTransfer.files.length) {
						e.preventDefault();
						e.stopPropagation();
						var files = e.originalEvent.dataTransfer.files;
						_this.openFile(files[0]);
					} else if (e.originalEvent.dataTransfer) {
						var url = e.originalEvent.dataTransfer.getData('URL');
						e.preventDefault();
						e.stopPropagation();
						_this.openFile(url);
					}
				});
	},
	open : function(options) {
		this.dispose();
		if (this.heatmap == null) {
			options.landingPage = this;
			options.el = this.pageOptions.el;
			this.heatmap = new morpheus.HeatMap(options);
		} else {
			options.inheritFromParent = false;
			options.parent = this.heatmap;
			new morpheus.HeatMap(options);
		}
	},
	openFile : function(value) {
		var _this = this;
		var options = {
			dataset : value
		};
		var fileName = morpheus.Util.getFileName(value);
		morpheus.OpenDatasetTool.fileExtensionPrompt(fileName, function(
				readOptions) {
			if (readOptions) {
				var dataset = options.dataset;
				options.dataset = {
					file : dataset,
					options : {}
				};
				for ( var key in readOptions) {
					options.dataset.options[key] = readOptions[key];
				}
			}
			_this.open(options);
		});

	}
};