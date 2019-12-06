import Component from '@glimmer/component';
import { action } from "@ember/object";
import config from "../config/environment";

export default class LoginFormComponent extends Component {
	title = config.name;

	@action
	didInsert(element) {
		$(element).find("#login-form").form({
			inline : true,
			fields : {
				email    : {
					identifier : "email",
					rules      : [
						{
							type   : "empty",
							prompt : "Enter your email."
						},
						{
							type   : "email",
							prompt : "Enter a valid email."
						}
					]
				},
				password : {
					identifier : "password",
					rules      : [
						{
							type   : "empty",
							prompt : "Enter your password."
						}
					]
				}
			}
		});
	}
}
