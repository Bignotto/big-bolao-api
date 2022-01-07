import { MatchInMemoryRepository } from '@modules/matches/repositories/inMemory/MatchInMemoryRepository';
import { UpdateMatchResultUseCase } from './UpdateMatchResultUseCase';

let updateMatch: UpdateMatchResultUseCase;
let matchRepository: MatchInMemoryRepository;

describe('Update Match Results Use Case', () => {
  beforeEach(() => {
    matchRepository = new MatchInMemoryRepository();
    updateMatch = new UpdateMatchResultUseCase(matchRepository);
  });

  it('should be able to update a match result', async () => {
    const match = await matchRepository.create({
      description: 'Test Match',
      match_location: 'Testville - TN',
      match_stadium: 'Tests Arena',
      match_date: new Date(),
      home_team: 'bra',
      away_team: 'arg',
    });

    await updateMatch.execute({
      match_id: match.id,
      home_team_score: 3,
      away_team_score: 0,
    });

    const foundMatch = await matchRepository.findById(match.id);
    expect(foundMatch.home_team_score).toBe(3);
    expect(foundMatch.away_team_score).toBe(0);
  });
});
