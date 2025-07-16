/*
  # Helper Functions for Deck Card Count Management

  1. Functions
    - `increment_deck_card_count` - Increments card count for a deck
    - `decrement_deck_card_count` - Decrements card count for a deck
*/

-- Function to increment deck card count
CREATE OR REPLACE FUNCTION increment_deck_card_count(deck_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE flashcard_decks 
  SET card_count = card_count + 1,
      updated_at = now()
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement deck card count
CREATE OR REPLACE FUNCTION decrement_deck_card_count(deck_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE flashcard_decks 
  SET card_count = GREATEST(card_count - 1, 0),
      updated_at = now()
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate deck card counts (for maintenance)
CREATE OR REPLACE FUNCTION recalculate_deck_card_counts()
RETURNS void AS $$
BEGIN
  UPDATE flashcard_decks 
  SET card_count = (
    SELECT COUNT(*) 
    FROM flashcards 
    WHERE flashcards.deck_id = flashcard_decks.id
  ),
  updated_at = now();
END;
$$ LANGUAGE plpgsql;