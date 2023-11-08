var jsPsychHtmlTypingResponse = (function (jspsych) {
  'use strict';

  const info = {
      name: "html-typing-response",
      parameters: {
          /**
           * The HTML string to be displayed.
           */
          stimulus: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Stimulus",
              default: undefined,
          },
          /**
           * Show or hide the trial
           */
          show_trial: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: "Show Trial",
              default: true,
          },
          /**
           * Array containing the key(s) the subject is allowed to press to respond to the stimulus.
           */
          choices: {
              type: jspsych.ParameterType.KEYS,
              pretty_name: "Choices",
              default: "ALL_KEYS",
          },
          /**
           * Message to display inside button to submit typewritten responses
           */
          button_prompt: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Button Prompt",
              default: null,
          },
          /**
           * Any content here will be displayed below the stimulus.
           */
          prompt: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Prompt",
              default: null,
          },
           /**
           * Any content here will be displayed below the stimulus.
           */
          text_box_height: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Text Box Height",
              default: 300,
          },
          /**
           * How long to show the stimulus.
           */
          stimulus_duration: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Stimulus duration",
              default: null,
          },
          /**
           * How long to show trial before it ends.
           */
          trial_duration: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Trial duration",
              default: null,
          },
          /**
           * If true, trial will end when subject makes a response.
           */
          response_ends_trial: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: "Response ends trial",
              default: true,
          },
      },
  };
  /**
   * **html-keyboard-response**
   *
   * jsPsych plugin for displaying a stimulus and getting a keyboard response
   *
   * @author Josh de Leeuw
   * @see {@link https://www.jspsych.org/plugins/jspsych-html-keyboard-response/ html-keyboard-response plugin documentation on jspsych.org}
   */
  class HtmlTypingResponsePlugin {
      constructor(jsPsych) {
          this.jsPsych = jsPsych;
      }
      trial(display_element, trial) {

          if(trial.show_trial == true) {
          var new_html = '<div id="jspsych-html-typing-response-stimulus">' + trial.stimulus + "</div>";

          //add typing display

          new_html += '<div id="jspsych-html-typing-response-display" style="height:' + trial.text_box_height + 'px">_</div>';
          new_html += '<div id="typing-response-word-count"></div>';

          // add prompt
          if (trial.prompt !== null) {
              new_html += trial.prompt;
          }
          // add submit button
          new_html += `
          <button id="endTyping" class="jspsych-btn">`+ trial.button_prompt + `</button>
          `;
          } else {
            var new_html = "";
          }

          // draw
          display_element.innerHTML = new_html;


          // store response
          // changed to arrays
          var response = {
              rt: [],
              key: [],
              typing_display: ""
          };

          //function to convert RTs to iksis
          const rt_to_iksi = (rt) => {
            let iksi = [];
            iksi.push(rt[0]);
            for(let i=1; i<rt.length; i++){
                iksi.push(rt[i] - rt[i-1]);
            }
            return(iksi);
          };

          // function to end trial when it is time
          const end_trial = () => {
              if(trial.show_trial == true) {
              // kill any remaining setTimeout handlers
              this.jsPsych.pluginAPI.clearAllTimeouts();
              // kill keyboard listeners
              if (typeof keyboardListener !== "undefined") {
                  this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
              }
              // gather the data to store for the trial
              // rt and response changed to JSON.stringify
              var trial_data = {
                  rt: response.rt,
                  iksi: rt_to_iksi(response.rt),
                  stimulus: trial.stimulus,
                  response: response.key,
                  paragraph: response.typing_display
              };
              // clear the display
              display_element.innerHTML = "";
              // move on to the next trial
              this.jsPsych.finishTrial(trial_data);
              }
          };

          // allow button to end trial
          if(trial.show_trial == true) {
            display_element.querySelector("#endTyping").addEventListener("click",end_trial);
          }

          // function to handle responses by the subject
          var after_response = (info) => {
              // after a valid response, the stimulus will have the CSS class 'responded'
              // which can be used to provide visual feedback that a response was recorded
             // display_element.querySelector("#jspsych-html-typing-response-stimulus").className +=
              //    " responded";

              //record multiple responses
              response.rt.push(info.rt);
              response.key.push(info.key);

              // whole text after edits

              // Write keyboard responses to the screen
              if(jsPsych.pluginAPI.compareKeys(info.key, "Backspace")){
                response.typing_display = response.typing_display.slice(0,-1);
                display_element.querySelector("#jspsych-html-typing-response-display").innerHTML = response.typing_display + "_";

              } else {
                response.typing_display += info.key;
                display_element.querySelector("#jspsych-html-typing-response-display").innerHTML = response.typing_display + "_";
              }

              //show word count
              //if(info.key == " "){
              //  let word_count = response.typing_display.split(" ").length;
              //  display_element.querySelector("#typing-response-word-count").innerHTML = word_count;
              // }

              if (trial.response_ends_trial) {
                  end_trial();
              }
          };
          // start the response listener
          if (trial.choices != "NO_KEYS") {
              var keyboardListener = this.jsPsych.pluginAPI.getKeyboardResponse({
                  callback_function: after_response,
                  valid_responses: trial.choices,
                  rt_method: "performance",
                  persist: true, // changed to true
                  allow_held_key: true,
              });
          }
          // hide stimulus if stimulus_duration is set
          if (trial.stimulus_duration !== null) {
              this.jsPsych.pluginAPI.setTimeout(() => {
                  display_element.querySelector("#jspsych-html-typing-response-stimulus").style.visibility = "hidden";
              }, trial.stimulus_duration);
          }
          // end trial if trial_duration is set
          if (trial.trial_duration !== null) {
              this.jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
          }
      }
      simulate(trial, simulation_mode, simulation_options, load_callback) {
          if (simulation_mode == "data-only") {
              load_callback();
              this.simulate_data_only(trial, simulation_options);
          }
          if (simulation_mode == "visual") {
              this.simulate_visual(trial, simulation_options, load_callback);
          }
      }
      create_simulation_data(trial, simulation_options) {
          const default_data = {
              stimulus: trial.stimulus,
              rt: this.jsPsych.randomization.sampleExGaussian(500, 50, 1 / 150, true),
              response: this.jsPsych.pluginAPI.getValidKey(trial.choices),
          };
          const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
          this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
          return data;
      }
      simulate_data_only(trial, simulation_options) {
          const data = this.create_simulation_data(trial, simulation_options);
          this.jsPsych.finishTrial(data);
      }
      simulate_visual(trial, simulation_options, load_callback) {
          const data = this.create_simulation_data(trial, simulation_options);
          const display_element = this.jsPsych.getDisplayElement();
          this.trial(display_element, trial);
          load_callback();
          if (data.rt !== null) {
              this.jsPsych.pluginAPI.pressKey(data.response, data.rt);
          }
      }
  }
  HtmlTypingResponsePlugin.info = info;

  return HtmlTypingResponsePlugin;

})(jsPsychModule);
