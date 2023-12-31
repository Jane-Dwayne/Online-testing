class EndScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'EndScene',
        });
    }

    init(data) {
        this.scoreVal = data.score;
        this.topScore = data.topScore;
    }

    create() {
        this.text = this.make.text();
        this.text.x = 130;
        this.text.y = 250;
        this.text.setText('End of the task!\n\n\n\nTop score: ' + this.topScore +
            '\n\n\nClick here to answer some questions and finish the task');
        this.text.setAlign('center');
        this.saveData();
        this.text.setInteractive();
        this.text.on('pointerup', function() {
            document.getElementById('consent').innerHTML = "    <div id=\"questionnaires\">\n" +
                "    </div>";
            $.ajax({
                url: 'questionnaires_json.txt',
                success: function (data) {
                    let questionnaire_data = JSON.parse(data);
                    let qs = Object.keys(questionnaire_data);
                    qs = Phaser.Utils.Array.Shuffle(qs);

                    this.createDemographics();
                    for (i=0; i < qs.length; i++) {
                        this.createQuestionnaire(questionnaire_data[qs[i]]);
                    }

                    let forms = document.getElementsByName("fs_");

                    for (let i = 5; i < forms.length; i++) {

                        // Generate function to scroll to next question if we're not on the last question

                        if (i < forms.length - 1) {

                            forms[i].setAttribute("scrollPos", $(forms[i + 1]).offset().top - 100);

                            $(forms[i]).children().children().click(function () {
                                $('html, body').animate({
                                    scrollTop: $(this).parent().parent().attr("scrollPos")
                                }, 400);
                            });
                        }
                    }

                    const submit = document.createElement('button');
                    submit.setAttribute("class", "submit_button");
                    submit.setAttribute("type", "button");
                    submit.setAttribute("id", "submit");
                    submit.append("Complete task");

                    const submit_form = document.createElement("form");
                    submit_form.setAttribute("class", "submitContainer");

                    submit_form.appendChild(submit);

                    document.getElementById('questionnaires').appendChild(submit_form);

                    document.getElementById('submit').onclick = this.getValues.bind(this);

                    function scrollToQuestions() {
                        const {value} = this.parentNode.querySelector('input[type="text"]');
                        if (value.length > 0) {
                            $('html, body').animate({
                                scrollTop: $(document.getElementById("header")).offset().top - 100
                            }, 400);
                        }

                        else {
                            const legend = this.parentNode.querySelectorAll('[name="legend"]')[0];
                            legend.style.color = "#ff0000";
                        }
                    }

                },
                async: false,
                context: this.scene
            });

        });
    }

    update() {
    }

    async saveData({
                    attributes = []
                    } = {})
    {

        const csv = "";

        const header = this.cache.game.dataKeys;

        const d = new Date();
        const key = 'game_data_' + this.cache.game.subjectID + '_' + d.getDate() + d.getMonth() + d.getFullYear();

        for (const h = 0; h < header.length; h++) {
            if (h > 0) {
            csv += ', ';
            }
            csv == csv + header[h];
        }
        csv += '\n';
        for (const r = 0; r < this.cache.game.data.length; r++) {
            for (const h = 0; h < header.length; h++) {
                if (h > 0) {
                csv += ', ';
                }
                csv += this.cache.game.data[r][header[h]];
            }
            csv += '\n';
        }

        // const a = {};
        try {
            const a = await this.cache.game.serverManager.uploadData(key+'.csv', csv);
        }
        catch (err) {
            Sentry.captureException(err);
        }
        return a

    }

    async saveQuestionnaireData({
                    attributes = []
                    } = {})
    {

        const csv = "";

        const header = ['subjectID', 'question_name', 'value', 'question_id', 'reverse_coded'];

        const d = new Date();
        const key = 'questionnaire_data_' + this.cache.game.subjectID + '_' + d.getDate() + d.getMonth() + d.getFullYear();

        for (const h = 0; h < header.length; h++) {
            if (h > 0) {
            csv += ', ';
            }
            csv += header[h];
        }
        csv += '\n';
        for (const r = 1; r < this.q_data.length; r++) {
            for (const h = 0; h < header.length; h++) {
                if (h > 0) {
                csv += ', ';
                }
                csv += this.q_data[r][header[h]];
            }
            csv += '\n';
        }


        // const a = {};
        const a = await this.cache.game.serverManager.uploadData(key+'.csv', csv);

        window.location.href = 'https://app.prolific.ac/submissions/complete?cc=DCY6UA5M';
        return a

    }


    createQuestion(questionnaireName, questionData) {


        const f = document.createElement("form");
        f.setAttribute('method',"post");
        //    f.setAttribute('action',"submit.php");
        f.setAttribute('id', questionnaireName.concat('_' + questionData.qNumber.toString()));
        f.setAttribute("name", "form_");

        const fieldset = document.createElement("fieldset");
        fieldset.setAttribute("class", "form__options");
        fieldset.setAttribute('id', questionnaireName.concat('_' + questionData.qNumber.toString()));
        fieldset.setAttribute("name", "fs_");
        fieldset.setAttribute("reverse_coded", questionData.reverse_coded);
        fieldset.setAttribute("question_id", questionData.question_id);

        const legend = document.createElement("legend");
        legend.setAttribute("class", "form__question");
        legend.setAttribute("name", "legend");
        legend.append(questionData.prompt);

        fieldset.appendChild(legend);

        const labels = [];

        for (const i = 0; i < questionData.labels.length; i++) {

            const p = document.createElement("p");
            p.setAttribute('class', 'form__answer');
            const c = document.createElement("input");
            c.type = "radio";
            c.id = questionnaireName.concat(questionData.qNumber.toString()).concat("answer".concat(i.toString()));
            c.name = "question";
            c.value = i;

            const l = document.createElement("label");
            l.setAttribute('for', c.id);
            l.append(questionData.labels[i]);

            p.appendChild(c);
            p.appendChild(l);

            labels.push(p);

            fieldset.appendChild(p)

        }

        f.appendChild(fieldset);


        return f;

    }


    createPreamble(preamble) {

        const h = document.createElement("header");
        h.setAttribute("class", "form__header");
        h.setAttribute("name", "fs_");

        const p = document.createElement("p");
        p.setAttribute("class", "preamble");

        const div = document.createElement("div");
        div.innerHTML = preamble;

        p.appendChild(div);
        h.appendChild(p);

        return h

    }


    createQuestionnaire(questionnaireData) {

        const preamble = this.createPreamble(questionnaireData.preamble);

        document.getElementById('questionnaires').appendChild(preamble);

        for (const j = 0; j < questionnaireData.questions.length; j++) {

            questionnaireData.questions[j].qNumber = j;

            if (j < questionnaireData.questions.length - 1) {
                const next = questionnaireData.name.concat((j+1).toString());
            }

            document.getElementById('questionnaires').appendChild(this.createQuestion(questionnaireData.name,
                questionnaireData.questions[j], next));

        }

    }

    createDemographics() {

        const preamble = this.createPreamble("First, we need some information about you");
        document.getElementById('questionnaires').appendChild(preamble);


        // Sex
        const qDataSex = {
            qNumber: 0,
            prompt: "What is your sex?",
            labels: ['Male', 'Female']
        };

        const sexQuestion = this.createQuestion('Sex', qDataSex);
        document.getElementById('questionnaires').appendChild(sexQuestion);


        // Age
        const ageForm = document.createElement("form");
        ageForm.setAttribute('method',"post");
        ageForm.setAttribute('id', "age");
        ageForm.setAttribute("name", "form_");

        const ageFieldSet = document.createElement("fieldset");
        ageFieldSet.setAttribute("class", "form__options");
        ageFieldSet.setAttribute('id', "age");
        ageFieldSet.setAttribute("name", "fs_");

        const legendAge = document.createElement("legend");
        legendAge.setAttribute("class", "questionDemo");
        legendAge.append("How old are you?");
        legendAge.setAttribute("name", "legend");
        legendAge.name = 'question';

        ageFieldSet.appendChild(legendAge);

        const box = document.createElement("input");
        box.setAttribute("class", "textEntry");
        box.setAttribute("type", "text");
        box.setAttribute("id", "Age");
        box.name = 'question';

        ageFieldSet.appendChild(box);

        ageForm.appendChild(ageFieldSet);
        document.getElementById('questionnaires').appendChild(ageForm);

        // Asteroid unpleasantness
        const asteroidForm = document.createElement("form");
        asteroidForm.setAttribute('method',"post");
        asteroidForm.setAttribute('id', "age");
        asteroidForm.setAttribute("name", "form_");

        const asteroidFieldSet = document.createElement("fieldset");
        asteroidFieldSet.setAttribute("class", "form__options");
        asteroidFieldSet.setAttribute('id', "asteroid_rating");
        asteroidFieldSet.setAttribute("name", "fs_");

        const legendShock = document.createElement("legend");
        legendShock.setAttribute("class", "questionDemo");
        legendShock.setAttribute("name", "legend");
        legendShock.innerHTML = "<p>How much did you want to avoid the asteroids?</p>" +
            "<p><span class='small_text'>(0 = not at all, 100 = a lot)</span></p>";

        asteroidFieldSet.appendChild(legendShock);

        const sliderBox = document.createElement("div");
        sliderBox.setAttribute("class", "slidecontainer");

        const slider = document.createElement("input");
        slider.setAttribute("type", "range");
        slider.setAttribute("min", "0");
        slider.setAttribute("max", "100");
        slider.setAttribute("class", "slider");
        slider.setAttribute("id", "asteroidUnpleasantness");
        slider.name = 'question';

        const sliderLabelLeft = document.createElement("p");
        sliderLabelLeft.setAttribute("class", "sliderLabel");
        sliderLabelLeft.append("0");
        const sliderLabelRight = document.createElement("p");
        sliderLabelRight.setAttribute("class", "sliderLabel");
        sliderLabelRight.append("100");

        sliderBox.appendChild(sliderLabelLeft);
        sliderBox.appendChild(slider);
        sliderBox.appendChild(sliderLabelRight);

        asteroidFieldSet.appendChild(sliderBox);

        asteroidForm.appendChild(asteroidFieldSet);

        // Asteroid anxiety
        const anxietyForm = document.createElement("form");
        anxietyForm.setAttribute('method',"post");
        anxietyForm.setAttribute('id', "anxietySlider");
        anxietyForm.setAttribute("name", "form_");

        const anxietyFieldSet = document.createElement("fieldset");
        anxietyFieldSet.setAttribute("class", "form__options");
        anxietyFieldSet.setAttribute('id', "anxiety_rating");
        anxietyFieldSet.setAttribute("name", "fs_");

        const legendAnxiety = document.createElement("legend");
        legendAnxiety.setAttribute("class", "questionDemo");
        legendAnxiety.setAttribute("name", "legend");
        legendAnxiety.innerHTML = "<p>How anxious did the game make you feel?</p>" +
            "<p><span class='small_text'>0 = not at all anxious, 100 = very anxious - when answering this, " +
            "think of how anxious you felt in relation to the range of anxiety you might experience in a " +
            "video game</span></p>";

        anxietyFieldSet.appendChild(legendAnxiety);

        const anxietySliderBox = document.createElement("div");
        anxietySliderBox.setAttribute("class", "slidecontainer");

        const anxietySlider = document.createElement("input");
        anxietySlider.setAttribute("type", "range");
        anxietySlider.setAttribute("min", "0");
        anxietySlider.setAttribute("max", "100");
        anxietySlider.setAttribute("class", "slider");
        anxietySlider.setAttribute("id", "anxietyAsteroids");
        anxietySlider.name = 'question';

        const anxietySliderLabelLeft = document.createElement("p");
        anxietySliderLabelLeft.setAttribute("class", "sliderLabel");
        anxietySliderLabelLeft.append("0");
        const anxietySliderLabelRight = document.createElement("p");
        anxietySliderLabelRight.setAttribute("class", "sliderLabel");
        anxietySliderLabelRight.append("100");

        anxietySliderBox.appendChild(anxietySliderLabelLeft);
        anxietySliderBox.appendChild(anxietySlider);
        anxietySliderBox.appendChild(anxietySliderLabelRight);

        anxietyFieldSet.appendChild(anxietySliderBox);

        anxietyForm.appendChild(anxietyFieldSet);

        document.getElementById('questionnaires').appendChild(asteroidForm);
        document.getElementById('questionnaires').appendChild(anxietyForm);

    }

    getValues() {

        // get values
        const inputs = document.getElementsByName("fs_");

        const values = {};
        const incomplete = [];
        this.q_data = [];

        for (const i = 0; i < inputs.length; i++) {

            const q_values = {};
            q_values.subjectID = this.cache.game.subjectID;

            if (inputs[i].id.length > 0) {
                const {id} = inputs[i];
                const question_id = inputs[i].getAttribute("question_id");
                const reverse_coded = inputs[i].getAttribute("reverse_coded");
                q_values.question_name = id;
                q_values.question_id = question_id;
                q_values.reverse_coded = reverse_coded;

                const legend = inputs[i].querySelectorAll('[name="legend"]')[0];

                const checked = inputs[i].querySelector('input[name="question"]:checked');

                if (checked != null) {
                    legend.style.color = "#000000";
                    const {value} = checked;
                    values[id] = value;
                    q_values.value = value;
                }

                else if (inputs[i].querySelector('input[type="text"]')) {

                    const {value} = inputs[i].querySelector('input[type="text"]');
                    if (value.length == 0) {

                        legend.style.color = "#ff0000";
                        incomplete.push(id);
                    }

                    else {
                        legend.style.color = "#000000";
                        if (id == 'subjectID') {
                            const subjectID = value;
                        }
                        values[id] = value;
                        q_values.value = value;
                    }
                }

                else if (inputs[i].querySelector('input[type="range"]')) {
                    const {value} = inputs[i].querySelector('input[type="range"]');
                    values[id] = value;
                    q_values.value = value;

                }

                else {
                    legend.style.color = "#ff0000";
                    incomplete.push(id);
                }
            }
            this.q_data.push(q_values);

        }


        if (incomplete.length > 0) {
            $('html, body').animate({
                scrollTop: $(document.getElementById(incomplete[0])).offset().top - 100
            }, 400);
        }

        else {
            const valuesAsJSON = JSON.stringify(values);
            this.saveQuestionnaireData();

        }

    }


    createSubjectID() {


        const subjectIDForm = document.createElement("form");
        subjectIDForm.setAttribute('method',"post");
        subjectIDForm.setAttribute('id', "SubjectID");

        const subjectIDFieldSet = document.createElement("fieldset");
        subjectIDFieldSet.setAttribute("class", "form__options");
        subjectIDFieldSet.setAttribute('id', "subjectID");
        subjectIDFieldSet.setAttribute("name", "fs_");

        const legendShock = document.createElement("legend");
        legendShock.setAttribute("class", "questionDemo");
        legendShock.setAttribute("name", "legend");
        legendShock.innerHTML = "Enter subject ID";

        const boxSubjectID = document.createElement("input");
        boxSubjectID.setAttribute("class", "textEntry");
        boxSubjectID.setAttribute("type", "text");
        boxSubjectID.setAttribute("id", "SubjectID");


        const submitSubjectID = document.createElement('button');
        submitSubjectID.setAttribute("class", "submit_button");
        submitSubjectID.setAttribute("type", "button");
        submitSubjectID.setAttribute("id", "subjectIDSubmit");
        submitSubjectID.append("OK");

        subjectIDFieldSet.appendChild(legendShock);
        subjectIDFieldSet.appendChild(boxSubjectID);
        subjectIDFieldSet.appendChild(submitSubjectID);
        subjectIDForm.appendChild(subjectIDFieldSet);

        document.getElementById('subjectID').appendChild(subjectIDForm);

    }

}

export default EndScene;