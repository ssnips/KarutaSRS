class Poem < ApplicationRecord
	# Validation
	validates :name, presence: true
	validates :first_verse, presence: true
	validates :second_verse_raw, presence: true
	validates :second_verse_card, presence: true
	validates :second_verse_answer, presence: true
	validates :kimariji, presence: true
	validates :translation, presence: true
	validates :background, presence: true

	# Relationships
	has_many :learned_items
end
