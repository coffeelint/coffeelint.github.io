(function () {

    var buildReportTable = function (errors) {

        var table = $('<div class="error_report">');
        $.each(errors, function (index, error) {
            var row = $('<div></div>');
            var lc = $('<span class="lineNumber"></span>'
                                ).html("Line #" + error.lineNumber + ':');
            var rc = $('<span class="reason"></span>').html(error.message);
            row.append(lc, rc);
            table.append(row);
        });
        return table;
    };


    var update = function (title, status_, content) {
        $('.report .section_body').empty().append(content || "").show();
        $('.report .section_title').text(title);
        $('.report_row').removeClass('success failure').addClass(status_).slideDown();

    };

    var displayReport = function (errors) {

        var title = 'Your code is lint free!';
        var status_ = 'success';
        var body = '';

        if (errors.length != 0) {
            title = 'Your code has lint.';
            status_ = 'failure';
            body = buildReportTable(errors);
        }

        update(title, status_, body);
    };

    var displayError = function (error) {
        var body = $('<div class="error_report"></div>');
        body.append(error.toString());
        update('Your code has an error', 'failure', body);
    };

    var runLinter = function () {
        var source = $('.run_editor').val();
        var config = $('.config_editor').val();
        var errors = [];
        var compileError = null;
        try {
            try {
                config = JSON.parse(config);
            } catch {
                throw new Error('Invalid configuration: Must be valid JSON');
            }
            errors = coffeelint.lint(source, config);
        } catch (e) {
            compileError = e;
        }
        if (compileError) {
            displayError(compileError);
        } else {
            displayReport(errors);
        }
    };

    var toggleConfiguration = function () {
        $('.config_editor_toggle').slideToggle();
    };

    var generateInitialConfig = function () {
        var config = coffeelint.getRules();
        for (const prop in config) {
            delete config[prop].name;
            delete config[prop].message;
            delete config[prop].description;
        }
        $('.config_editor').val(JSON.stringify(config, null, 2));
    }

    $(document).ready(function () {
        generateInitialConfig();
        $('.configuration').click(toggleConfiguration)
        $('.version').text('v' + coffeelint.VERSION);

        $('.editor').keyup(runLinter);
        $('.run_editor').focus();
        $('.run').click(runLinter);

        if (location.hash) {
            $([document.documentElement, document.body]).scrollTop($(location.hash).offset().top);
        }
    });

})();
