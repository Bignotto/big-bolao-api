import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { makeListPublicPoolsUseCase } from '@/useCases/pools/factory/makeListPublicPoolsUseCase';

const listPublicPoolsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(50).default(10),
  name: z.string().optional(),
});

type ListPublicPoolsQuery = z.infer<typeof listPublicPoolsQuerySchema>;

export async function listPublicPoolsController(
  request: FastifyRequest<{ Querystring: ListPublicPoolsQuery }>,
  reply: FastifyReply
) {
  try {
    const { page, perPage, name } = listPublicPoolsQuerySchema.parse(request.query);

    const listPublicPoolsUseCase = makeListPublicPoolsUseCase();
    const { pools } = await listPublicPoolsUseCase.execute({
      page,
      perPage,
      name,
    });

    return reply.status(200).send({ pools });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply
        .status(422)
        .send({ message: 'Validation error.', issues: error.format() });
    }

    throw error;
  }
}
