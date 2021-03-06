import Component from "@ember/component";
import { inject as service } from "@ember/service";
import localForage from "localforage";
import config from "../config/environment";

export default Component.extend({
	store               : service(),
	router              : service("router"),
	queue               : undefined,
	type                : "",
	chunk               : undefined,
	answers             : undefined,
	last_pushed_index   : 0,
	current_chunk_index : 0,
	user                : undefined,

	async init() {
		this.queue   = this.queue || [];
		this.answers = this.answers || {};
		this.user    = this.user || {};
		this.chunk   = [];

		this._super(...arguments);

		this.chunkQueue();

		let saved_answers = await localForage.getItem(`review-queue-answers-${this.type}`);

		if (saved_answers) {
			try {
				this.answers = JSON.parse(saved_answers);
			} catch (e) {
				this.answers = {};
			}
		}
	},

	chunkQueue() {
		for (let i = 0; i < 10; i++) {
			if (!this.queue[i]) {
				break;
			}

			this.pushItemToChunk(i);

			this.last_pushed_index = i;
		}

		if (this.chunk.length) {
			this.setActiveReview();
		}
	},

	pushItemToChunk(index) {
		let item = this.queue[index];

		if (!item) {
			return;
		}

		let poem    = (this.type === "lessons") ? item : item.poem;
		let item_id = item.id;

		for (let review_type of ["grabber", "kimariji"]) {
			if (this.answers[item_id]) {
				this.answers[item_id][review_type] = false;
			}

			this.chunk.push({
				type : review_type,
				poem : poem,
				id   : index
			});
		}
	},

	setActiveReview() {
		this.current_chunk_index = Math.floor(Math.random() * this.chunk.length);

		this.set("current_poem", this.chunk[this.current_chunk_index].poem);
		this.set("current_type", this.chunk[this.current_chunk_index].type);
		this.set("current_id", this.chunk[this.current_chunk_index].id);
	},

	actions : {
		async completeReview(correct, time_elapsed) {
			let id      = this.current_id;
			let item_id = this.queue[id].id;

			if (!this.answers[item_id]) {
				this.answers[item_id] = {
					correct : 0,
					timings : {
						total   : 0,
						correct : 0
					},
					wrong : {
						wrong_answers  : 0,
						wrong_kimariji : 0,
						wrong_grabber  : 0
					},
					kimariji : false,
					grabber  : false
				};
			}

			this.answers[item_id].timings.total += time_elapsed;

			if (!correct) {
				this.answers[item_id].wrong.wrong_answers++;
				this.answers[item_id].wrong[`wrong_${this.current_type}`]++;
			} else {
				this.answers[item_id].correct++;

				this.answers[item_id][this.current_type] = true;

				this.answers[item_id].timings.correct += time_elapsed;
			}

			if (correct) {
				delete this.chunk[this.current_chunk_index];
			}

			this.chunk = this.chunk.filter((val) => val);

			if (this.answers[item_id].kimariji && this.answers[item_id].grabber) {
				if (this.type === "lessons") {
					let learned_item = this.store.createRecord(
						"learned-item",
						{
							user : this.user,
							poem : await this.store.findRecord("poem", item_id)
						}
					);

					await localForage.setItem("lesson-review-queue", JSON.stringify(this.queue));
					await learned_item.save();
				} else {
					let timings = {
						avg_total_time   : this.answers[item_id].timings.total / (this.answers[item_id].correct + this.answers[item_id].wrong.wrong_answers),
						avg_correct_time : this.answers[item_id].timings.correct / this.answers[item_id].correct
					};
					let request = {
						url         : `${config.API_HOST}/learned-items/${item_id}/complete-review`,
						type        : "POST",
						contentType : "application/json",
						data        : JSON.stringify(Object.assign({}, this.answers[item_id].wrong, timings))
					};

					await $.ajax(request);
				}

				this.pushItemToChunk(this.last_pushed_index + 1);
				this.last_pushed_index++;
				delete this.answers[item_id];
			}

			await localForage.setItem(`review-queue-answers-${this.type}`, JSON.stringify(this.answers));
		},

		async triggerNextReview() {
			if (this.chunk.length) {
				this.setActiveReview();
			} else {
				await localForage.setItem(`review-queue-answers-${this.type}`, JSON.stringify({}));
				this.router.transitionTo("authenticated.reviews");
			}
		}
	}
});
