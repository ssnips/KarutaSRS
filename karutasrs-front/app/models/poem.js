import Model from '@ember-data/model';
import { attr } from "@ember-data/model";

export default class PoemModel extends Model {
	@attr name;
	@attr first_verse;
	@attr second_verse_raw;
	@attr second_verse_card;
	@attr second_verse_answer;
	@attr kimariji;
}
